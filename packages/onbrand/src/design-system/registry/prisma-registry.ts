import path from "node:path";
import type { S3 } from "@onbrand/s3";
import type { PrismaClient } from "@prisma/client";
import type { AuthContext } from "../../auth/context";
import type { DesignSystemSummary } from "../design-system";
import {
  type BrandKitAssetDownload,
  type BrandKitAssetMaterializationPlan,
  type McpBrandKit,
  type McpDecorativeAsset,
  type SupportedAssetMimeType,
  UnknownBrandKitAssetError,
  UnmaterializedBrandKitAssetError,
} from "../brand-kit/asset";
import type {
  DesignSystemRegistry,
  MaterializeBrandKitAssetsRequest,
  McpDesignSystem,
  McpPresentationKit,
} from "./registry";
import { UnknownDesignSystemError } from "./registry";

type StoredAsset = Readonly<{
  assetId: string;
  kind: "LOGO" | "DECORATIVE_ASSET";
  name: string;
  filename: string;
  mimeType: string;
  description: string;
  s3Key: string | null;
  sortOrder: number;
}>;

export class PrismaDesignSystemRegistry implements DesignSystemRegistry {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly s3: Pick<typeof S3, "getPresigned">,
    private readonly brandKitAssetBucket: string,
    private readonly assetDownloadExpiresInSeconds: number,
  ) {}

  listDesignSystems = async (auth: AuthContext): Promise<readonly DesignSystemSummary[]> => {
    const rows = await this.prisma.designSystem.findMany({
      where: { ownerUserId: auth.ownerUserId },
      orderBy: { id: "asc" },
    });
    return rows.map((row) =>
      row.description === null
        ? { id: row.slug, name: row.name }
        : { id: row.slug, name: row.name, description: row.description },
    );
  };

  getDesignSystem = async (auth: AuthContext, designSystemId: string): Promise<McpDesignSystem> => {
    const stored = await loadStoredDesignSystem(this.prisma, auth, designSystemId);
    return toMcpDesignSystem(stored);
  };

  materializeBrandKitAssets = async (
    auth: AuthContext,
    { designSystemId, outputDirectory, assetHandles }: MaterializeBrandKitAssetsRequest,
  ): Promise<BrandKitAssetMaterializationPlan> => {
    const stored = await loadStoredDesignSystem(this.prisma, auth, designSystemId);
    const selectedAssets = selectAssets(designSystemId, stored.brandKit!.assets, assetHandles);
    const normalizedOutputDirectory = normalizeOutputDirectory(outputDirectory);
    const downloads = await Promise.all(
      selectedAssets.map((asset) =>
        toBrandKitAssetDownload(
          this.s3,
          this.brandKitAssetBucket,
          this.assetDownloadExpiresInSeconds,
          designSystemId,
          normalizedOutputDirectory,
          asset,
        ),
      ),
    );

    return {
      designSystemId,
      outputDirectory: normalizedOutputDirectory,
      expiresInSeconds: this.assetDownloadExpiresInSeconds,
      instructions:
        "Run the commands in the user's workspace to download exact Brand Kit files from short-lived S3 URLs. Do not paste, decode, or rewrite asset bytes manually from the MCP response.",
      commands: [
        `mkdir -p ${shellQuote(normalizedOutputDirectory)}`,
        ...downloads.map(
          (asset) =>
            `curl -fsSL ${shellQuote(asset.downloadUrl)} -o ${shellQuote(asset.targetPath)}`,
        ),
      ],
      assets: downloads,
    };
  };
}

const loadStoredDesignSystem = async (
  prisma: PrismaClient,
  auth: AuthContext,
  designSystemId: string,
) => {
  const row = await prisma.designSystem.findUnique({
    where: { ownerUserId_slug: { ownerUserId: auth.ownerUserId, slug: designSystemId } },
    include: {
      brandKit: {
        include: {
          colors: { orderBy: { sortOrder: "asc" } },
          assets: { orderBy: { sortOrder: "asc" } },
        },
      },
      presentationKit: true,
    },
  });
  if (!row || !row.brandKit || !row.presentationKit) {
    throw new UnknownDesignSystemError(designSystemId);
  }
  return row;
};

const toMcpDesignSystem = (
  stored: Awaited<ReturnType<typeof loadStoredDesignSystem>>,
): McpDesignSystem => ({
  designSystem:
    stored.description === null
      ? { id: stored.slug, name: stored.name }
      : { id: stored.slug, name: stored.name, description: stored.description },
  brandKit: toMcpBrandKit(stored.brandKit!.assets, stored.brandKit!.colors),
  presentationKit: toMcpPresentationKit(stored.presentationKit!),
});

const toMcpBrandKit = (
  assets: readonly StoredAsset[],
  colors: readonly { tokenId: string; name: string; value: string; description: string }[],
): McpBrandKit => {
  const logo = assets.find((asset) => asset.kind === "LOGO");
  if (!logo) throw new Error("Stored Design System is missing its Logo");

  return {
    colors: colors.map(({ tokenId, name, value, description }) => ({
      id: tokenId,
      name,
      value,
      description,
    })),
    logo: {
      name: logo.name,
      assetHandle: "LOGO",
      filename: logo.filename,
      mimeType: asSupportedMimeType(logo.mimeType),
      description: logo.description,
    },
    decorativeAssets: assets
      .filter((asset) => asset.kind === "DECORATIVE_ASSET")
      .map(toMcpDecorativeAsset),
  };
};

const toMcpPresentationKit = (presentationKit: {
  canvasWidth: number;
  canvasHeight: number;
  canvasUnit: string;
  designPrompt: string | null;
}): McpPresentationKit => ({
  canvas: {
    width: presentationKit.canvasWidth,
    height: presentationKit.canvasHeight,
    unit: "px",
  },
  ...(presentationKit.designPrompt === null ? {} : { designPrompt: presentationKit.designPrompt }),
});

const toMcpDecorativeAsset = (asset: StoredAsset): McpDecorativeAsset => ({
  id: asset.assetId,
  name: asset.name,
  assetHandle: decorativeAssetHandle(asset.assetId),
  filename: asset.filename,
  mimeType: asSupportedMimeType(asset.mimeType),
  description: asset.description,
});

const selectAssets = (
  designSystemId: string,
  assets: readonly StoredAsset[],
  assetHandles: readonly string[] | undefined,
): readonly StoredAsset[] => {
  if (!assetHandles) return assets;
  const byHandle = new Map(assets.map((asset) => [assetHandle(asset), asset]));
  const seen = new Set<string>();
  return assetHandles.map((handle) => {
    if (seen.has(handle)) {
      throw new Error(
        `Duplicate Brand Kit asset handle requested in Design System '${designSystemId}': ${handle}`,
      );
    }
    seen.add(handle);
    const asset = byHandle.get(handle);
    if (!asset) throw new UnknownBrandKitAssetError(designSystemId, handle);
    return asset;
  });
};

const assetHandle = (asset: StoredAsset): string =>
  asset.kind === "LOGO" ? "LOGO" : decorativeAssetHandle(asset.assetId);

const toBrandKitAssetDownload = async (
  s3: Pick<typeof S3, "getPresigned">,
  bucket: string,
  expiresInSeconds: number,
  designSystemId: string,
  outputDirectory: string,
  asset: StoredAsset,
): Promise<BrandKitAssetDownload> => {
  if (!asset.s3Key) throw new UnmaterializedBrandKitAssetError(designSystemId, assetHandle(asset));
  const targetPath = joinOutputPath(outputDirectory, asset.filename);
  const common = {
    assetHandle: assetHandle(asset),
    name: asset.name,
    filename: asset.filename,
    mimeType: asSupportedMimeType(asset.mimeType),
    downloadUrl: await s3.getPresigned({
      bucket,
      key: asset.s3Key,
      filename: asset.filename,
      contentType: asset.mimeType,
      expiresInSeconds,
    }),
    targetPath,
    ...(path.posix.isAbsolute(outputDirectory) ? {} : { relativePath: targetPath }),
  } as const;

  return asset.kind === "LOGO"
    ? { ...common, kind: "LOGO" }
    : { ...common, kind: "DECORATIVE_ASSET", id: asset.assetId };
};

const normalizeOutputDirectory = (outputDirectory: string): string => {
  const normalized = outputDirectory
    .trim()
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "");
  return normalized.length === 0 ? "." : normalized;
};

const joinOutputPath = (outputDirectory: string, filename: string): string =>
  outputDirectory === "." ? filename : path.posix.join(outputDirectory, filename);

const shellQuote = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;

const decorativeAssetHandle = (decorativeAssetId: string): string =>
  `DECORATIVE_ASSET_${decorativeAssetId.replaceAll("-", "_").toUpperCase()}`;

const asSupportedMimeType = (mimeType: string): SupportedAssetMimeType => {
  if (
    mimeType === "image/svg+xml" ||
    mimeType === "image/png" ||
    mimeType === "image/jpeg" ||
    mimeType === "image/webp"
  ) {
    return mimeType;
  }
  throw new Error(`Unsupported stored Brand Kit asset MIME type: ${mimeType}`);
};
