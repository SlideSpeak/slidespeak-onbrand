import path from "node:path";
import { brandKitAssetFileObjectKey } from "../brand-kit/storage/object-key";
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
  PrepareDesignSystemAssetUploadsRequest,
  PrepareDesignSystemAssetUploadsResult,
  WriteDesignSystemRequest,
  WriteDesignSystemResult,
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
    private readonly s3: Pick<typeof S3, "getPresigned" | "putPresigned">,
    private readonly brandKitAssetBucket: string,
    private readonly assetPresignedUrlExpiresInSeconds: number,
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
          this.assetPresignedUrlExpiresInSeconds,
          designSystemId,
          normalizedOutputDirectory,
          asset,
        ),
      ),
    );

    return {
      designSystemId,
      outputDirectory: normalizedOutputDirectory,
      expiresInSeconds: this.assetPresignedUrlExpiresInSeconds,
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

  prepareDesignSystemAssetUploads = async (
    auth: AuthContext,
    request: PrepareDesignSystemAssetUploadsRequest,
  ): Promise<PrepareDesignSystemAssetUploadsResult> => {
    const uploads = await Promise.all(
      request.uploads.map(async (upload) => {
        const s3Key = brandKitAssetFileObjectKey({
          ownerUserId: auth.ownerUserId,
          designSystemId: request.designSystemId,
          assetId: upload.assetId,
          filename: upload.filename,
        });
        const checksumSha256Base64 = hexToBase64Sha256(upload.sha256);
        const uploadUrl = await this.s3.putPresigned({
          bucket: this.brandKitAssetBucket,
          key: s3Key,
          contentType: upload.mimeType,
          checksumSha256Base64,
          expiresInSeconds: this.assetPresignedUrlExpiresInSeconds,
        });
        return {
          ...upload,
          s3Key,
          uploadUrl,
          expiresInSeconds: this.assetPresignedUrlExpiresInSeconds,
          method: "PUT" as const,
          headers: {
            "Content-Type": upload.mimeType,
          },
          command: `curl -fsSL -X PUT -H ${shellQuote(`Content-Type: ${upload.mimeType}`)} --upload-file ${shellQuote(upload.filename)} ${shellQuote(uploadUrl)}`,
        };
      }),
    );

    return {
      designSystemId: request.designSystemId,
      instructions:
        "Run each PUT command from the directory containing the exact asset file. Then call write_design_system with the returned s3Key, byteSize, and sha256 metadata. Do not send asset bytes through MCP.",
      uploads,
    };
  };

  writeDesignSystem = async (
    auth: AuthContext,
    request: WriteDesignSystemRequest,
  ): Promise<WriteDesignSystemResult> => {
    const storedAssets = [
      toStoredWritableAsset(
        auth.ownerUserId,
        request.designSystem.id,
        request.brandKit.logo,
        "logo",
        "LOGO",
        0,
      ),
      ...(request.brandKit.decorativeAssets ?? []).map((asset, index) =>
        toStoredWritableAsset(
          auth.ownerUserId,
          request.designSystem.id,
          asset,
          asset.id,
          "DECORATIVE_ASSET",
          index + 1,
        ),
      ),
    ];

    const action = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.designSystem.findUnique({
        where: {
          ownerUserId_slug: { ownerUserId: auth.ownerUserId, slug: request.designSystem.id },
        },
        select: { id: true },
      });
      const designSystem = await tx.designSystem.upsert({
        where: {
          ownerUserId_slug: { ownerUserId: auth.ownerUserId, slug: request.designSystem.id },
        },
        create: {
          ownerUserId: auth.ownerUserId,
          slug: request.designSystem.id,
          schemaVersion: 1,
          name: request.designSystem.name,
          description: request.designSystem.description,
        },
        update: { name: request.designSystem.name, description: request.designSystem.description },
      });
      await tx.brandKit.deleteMany({ where: { designSystemId: designSystem.id } });
      await tx.presentationKit.deleteMany({ where: { designSystemId: designSystem.id } });
      await tx.brandKit.create({
        data: {
          designSystemId: designSystem.id,
          colors: {
            create: request.brandKit.colors.map((color, index) => ({
              tokenId: color.id,
              name: color.name,
              value: color.value,
              description: color.description,
              sortOrder: index,
            })),
          },
          assets: { create: storedAssets },
        },
      });
      await tx.presentationKit.create({
        data: {
          designSystemId: designSystem.id,
          canvasWidth: request.presentationKit.canvas.width,
          canvasHeight: request.presentationKit.canvas.height,
          canvasUnit: request.presentationKit.canvas.unit,
          designPrompt: request.presentationKit.designPrompt,
        },
      });
      return existing ? "updated" : "created";
    });

    return {
      designSystemId: request.designSystem.id,
      action,
      designSystem: await this.getDesignSystem(auth, request.designSystem.id),
    };
  };
}

const toStoredWritableAsset = (
  ownerUserId: string,
  designSystemId: string,
  asset: {
    name: string;
    filename: string;
    mimeType: string;
    description: string;
    s3Key: string;
    byteSize: number;
    sha256: string;
  },
  assetId: string,
  kind: "LOGO" | "DECORATIVE_ASSET",
  sortOrder: number,
) => {
  const expectedS3Key = brandKitAssetFileObjectKey({
    ownerUserId,
    designSystemId,
    assetId,
    filename: asset.filename,
  });
  if (asset.s3Key !== expectedS3Key) {
    throw new Error(
      `Design System asset '${assetId}' must reference prepared upload key '${expectedS3Key}'`,
    );
  }
  return {
    assetId,
    kind,
    name: asset.name,
    filename: asset.filename,
    mimeType: asset.mimeType,
    description: asset.description,
    s3Key: asset.s3Key,
    byteSize: asset.byteSize,
    sha256: asset.sha256,
    sortOrder,
  };
};

const hexToBase64Sha256 = (hex: string): string => Buffer.from(hex, "hex").toString("base64");

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
