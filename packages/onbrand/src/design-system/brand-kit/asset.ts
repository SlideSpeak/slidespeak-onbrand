import { constants } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { BrandKit } from "./brand-kit";

const LOGO_ASSET_HANDLE = "LOGO";
const DECORATIVE_ASSET_HANDLE_PREFIX = "DECORATIVE_ASSET_";

export class UnknownBrandKitAssetError extends Error {
  constructor(
    readonly designSystemId: string,
    readonly assetHandle: string,
  ) {
    super(`Unknown Brand Kit asset '${assetHandle}' in Design System '${designSystemId}'`);
    this.name = "UnknownBrandKitAssetError";
  }
}

export type SupportedAssetMimeType = "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";

export type McpVisualAsset = Readonly<{
  name: string;
  assetHandle: string;
  filename: string;
  mimeType: SupportedAssetMimeType;
  description: string;
}>;

export type McpDecorativeAsset = Readonly<{
  id: string;
  name: string;
  assetHandle: string;
  filename: string;
  mimeType: SupportedAssetMimeType;
  description: string;
}>;

export type McpBrandKit = Readonly<{
  colors: BrandKit["colors"];
  logo: McpVisualAsset;
  decorativeAssets: readonly McpDecorativeAsset[];
}>;

type ResolvedBrandKitAsset =
  | Readonly<{
      kind: "LOGO";
      assetHandle: string;
      filePath: string;
      filename: string;
      mimeType: SupportedAssetMimeType;
      name: string;
    }>
  | Readonly<{
      kind: "DECORATIVE_ASSET";
      id: string;
      assetHandle: string;
      filePath: string;
      filename: string;
      mimeType: SupportedAssetMimeType;
      name: string;
    }>;

export type MaterializedBrandKitAsset =
  | Readonly<{
      kind: "LOGO";
      assetHandle: string;
      name: string;
      filename: string;
      mimeType: SupportedAssetMimeType;
      path: string;
    }>
  | Readonly<{
      kind: "DECORATIVE_ASSET";
      id: string;
      assetHandle: string;
      name: string;
      filename: string;
      mimeType: SupportedAssetMimeType;
      path: string;
    }>;

export type MaterializedBrandKitAssets = Readonly<{
  designSystemId: string;
  outputDirectory: string;
  assets: readonly MaterializedBrandKitAsset[];
}>;

type ResolveBrandKitAssetsRequest = Readonly<{
  designSystemId: string;
  folderPath: string;
  brandKit: BrandKit;
}>;

type ResolveBrandKitAssetBaseRequest = Readonly<{
  designSystemId: string;
  folderPath: string;
  source: string;
  assetHandle: string;
  name: string;
  usedFilenames: Set<string>;
}>;

type ResolveBrandKitAssetRequest =
  | (ResolveBrandKitAssetBaseRequest & Readonly<{ kind: "LOGO" }>)
  | (ResolveBrandKitAssetBaseRequest & Readonly<{ kind: "DECORATIVE_ASSET"; id: string }>);

type ResolvedBrandKitAssetResult = Readonly<{
  metadata: Readonly<{ assetHandle: string; filename: string; mimeType: SupportedAssetMimeType }>;
  asset: ResolvedBrandKitAsset;
}>;

export interface BrandKitAssetIndex {
  materialize(request: BrandKitAssetMaterializationRequest): Promise<MaterializedBrandKitAssets>;
}

export type ResolvedMcpBrandKitAssets = Readonly<{
  mcpBrandKit: McpBrandKit;
  assetIndex: BrandKitAssetIndex;
}>;

export const resolveBrandKitAssets = async ({
  designSystemId,
  folderPath,
  brandKit,
}: ResolveBrandKitAssetsRequest): Promise<ResolvedMcpBrandKitAssets> => {
  const usedFilenames = new Set<string>();
  const assets: ResolvedBrandKitAsset[] = [];

  const logoAsset = await resolveBrandKitAsset({
    designSystemId,
    folderPath,
    source: brandKit.logo.source,
    kind: "LOGO",
    assetHandle: LOGO_ASSET_HANDLE,
    name: brandKit.logo.name,
    usedFilenames,
  });
  assets.push(logoAsset.asset);

  const decorativeAssets: McpDecorativeAsset[] = [];
  const decorativeAssetIds = new Set<string>();
  for (const decorativeAsset of brandKit.decorativeAssets) {
    if (decorativeAssetIds.has(decorativeAsset.id)) {
      throw new Error(
        `Duplicate Decorative Asset id in Design System '${designSystemId}': ${decorativeAsset.id}`,
      );
    }
    decorativeAssetIds.add(decorativeAsset.id);

    const resolved = await resolveBrandKitAsset({
      designSystemId,
      folderPath,
      source: decorativeAsset.source,
      kind: "DECORATIVE_ASSET",
      id: decorativeAsset.id,
      assetHandle: decorativeAssetHandle(decorativeAsset.id),
      name: decorativeAsset.name,
      usedFilenames,
    });
    assets.push(resolved.asset);
    decorativeAssets.push({
      id: decorativeAsset.id,
      name: decorativeAsset.name,
      assetHandle: resolved.metadata.assetHandle,
      filename: resolved.metadata.filename,
      mimeType: resolved.metadata.mimeType,
      description: decorativeAsset.description,
    });
  }

  return {
    mcpBrandKit: {
      colors: brandKit.colors,
      logo: {
        name: brandKit.logo.name,
        assetHandle: logoAsset.metadata.assetHandle,
        filename: logoAsset.metadata.filename,
        mimeType: logoAsset.metadata.mimeType,
        description: brandKit.logo.description,
      },
      decorativeAssets,
    },
    assetIndex: new InMemoryBrandKitAssetIndex(designSystemId, assets),
  };
};

export type BrandKitAssetMaterializationRequest = Readonly<{
  outputDirectory: string;
  assetHandles?: readonly string[];
  overwrite?: boolean;
}>;

class InMemoryBrandKitAssetIndex implements BrandKitAssetIndex {
  constructor(
    private readonly designSystemId: string,
    private readonly assets: readonly ResolvedBrandKitAsset[],
  ) {}

  materialize = async ({
    outputDirectory,
    assetHandles,
    overwrite = true,
  }: BrandKitAssetMaterializationRequest): Promise<MaterializedBrandKitAssets> => {
    const selectedAssets = selectBrandKitAssets(this.designSystemId, this.assets, assetHandles);
    const resolvedOutputDirectory = path.resolve(outputDirectory);

    await mkdir(resolvedOutputDirectory, { recursive: true });

    const materializedAssets: MaterializedBrandKitAsset[] = [];
    for (const asset of selectedAssets) {
      const targetPath = path.join(resolvedOutputDirectory, asset.filename);
      if (overwrite) {
        await copyFile(asset.filePath, targetPath);
      } else {
        await copyFile(asset.filePath, targetPath, constants.COPYFILE_EXCL);
      }
      materializedAssets.push(toMaterializedBrandKitAsset(asset, targetPath));
    }

    return {
      designSystemId: this.designSystemId,
      outputDirectory: resolvedOutputDirectory,
      assets: materializedAssets,
    };
  };
}

const selectBrandKitAssets = (
  designSystemId: string,
  assets: readonly ResolvedBrandKitAsset[],
  assetHandles: readonly string[] | undefined,
): readonly ResolvedBrandKitAsset[] => {
  if (!assetHandles) {
    return assets;
  }

  const byHandle = new Map(assets.map((asset) => [asset.assetHandle, asset]));
  const seen = new Set<string>();
  return assetHandles.map((assetHandle) => {
    if (seen.has(assetHandle)) {
      throw new Error(
        `Duplicate Brand Kit asset handle requested in Design System '${designSystemId}': ${assetHandle}`,
      );
    }
    seen.add(assetHandle);

    const asset = byHandle.get(assetHandle);
    if (!asset) {
      throw new UnknownBrandKitAssetError(designSystemId, assetHandle);
    }
    return asset;
  });
};

const toMaterializedBrandKitAsset = (
  asset: ResolvedBrandKitAsset,
  targetPath: string,
): MaterializedBrandKitAsset =>
  asset.kind === "LOGO"
    ? {
        kind: "LOGO",
        assetHandle: asset.assetHandle,
        name: asset.name,
        filename: asset.filename,
        mimeType: asset.mimeType,
        path: targetPath,
      }
    : {
        kind: "DECORATIVE_ASSET",
        id: asset.id,
        assetHandle: asset.assetHandle,
        name: asset.name,
        filename: asset.filename,
        mimeType: asset.mimeType,
        path: targetPath,
      };

const resolveBrandKitAsset = async (
  request: ResolveBrandKitAssetRequest,
): Promise<ResolvedBrandKitAssetResult> => {
  const { designSystemId, folderPath, source, kind, assetHandle, name, usedFilenames } = request;
  const filename = path.basename(source);
  const mimeType = mimeTypeForFilename(filename);
  if (usedFilenames.has(filename)) {
    throw new Error(
      `Duplicate Brand Kit asset filename in Design System '${designSystemId}': ${filename}`,
    );
  }
  usedFilenames.add(filename);

  const base = {
    assetHandle,
    filePath: path.resolve(folderPath, source),
    filename,
    mimeType,
    name,
  };

  return {
    metadata: { assetHandle, filename, mimeType },
    asset:
      kind === "LOGO"
        ? { kind, ...base }
        : {
            kind,
            id: request.id,
            ...base,
          },
  };
};

const decorativeAssetHandle = (decorativeAssetId: string): string =>
  `${DECORATIVE_ASSET_HANDLE_PREFIX}${decorativeAssetId.replaceAll("-", "_").toUpperCase()}`;

const mimeTypeForFilename = (filename: string): SupportedAssetMimeType => {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  throw new Error(`Unsupported Brand Kit asset filename: ${filename}`);
};
