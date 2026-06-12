import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  resolveBrandKitAssets,
  type BrandKitAssetIndex,
  type McpBrandKit,
  type MaterializedBrandKitAssets,
} from "../brand-kit/asset";
import { ensureUniqueColorTokenIds } from "../brand-kit/color";
import { designSystemSchema, type DesignSystem, type DesignSystemSummary } from "../design-system";

export { UnknownBrandKitAssetError } from "../brand-kit/asset";
export type {
  MaterializedBrandKitAsset,
  MaterializedBrandKitAssets,
  McpBrandKit,
  McpDecorativeAsset,
  McpVisualAsset,
  SupportedAssetMimeType,
} from "../brand-kit/asset";

export class UnknownDesignSystemError extends Error {
  constructor(readonly designSystemId: string) {
    super(`Unknown Design System: ${designSystemId}`);
    this.name = "UnknownDesignSystemError";
  }
}

export type McpPresentationKit = Omit<DesignSystem["presentationKit"], "designPrompt"> &
  Readonly<{ designPrompt?: string }>;

export type McpDesignSystem = Readonly<{
  designSystem: DesignSystemSummary;
  brandKit: McpBrandKit;
  presentationKit: McpPresentationKit;
}>;

export type MaterializeBrandKitAssetsRequest = Readonly<{
  designSystemId: string;
  outputDirectory: string;
  assetHandles?: readonly string[];
  overwrite?: boolean;
}>;

export interface DesignSystemRegistry {
  listDesignSystems(): readonly DesignSystemSummary[];
  getDesignSystem(designSystemId: string): McpDesignSystem;
  materializeBrandKitAssets(
    request: MaterializeBrandKitAssetsRequest,
  ): Promise<MaterializedBrandKitAssets>;
}

type LoadedDesignSystem = Readonly<{
  source: DesignSystem;
  mcp: McpDesignSystem;
  assetIndex: BrandKitAssetIndex;
}>;

export const loadDesignSystemRegistry = async ({
  rootDir,
}: {
  rootDir: string;
}): Promise<DesignSystemRegistry> => {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const designSystems = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => loadDesignSystem(path.join(rootDir, entry.name), entry.name)),
  );

  const byId = new Map<string, LoadedDesignSystem>();
  for (const designSystem of designSystems) {
    if (byId.has(designSystem.source.id)) {
      throw new Error(`Duplicate Design System id: ${designSystem.source.id}`);
    }
    byId.set(designSystem.source.id, designSystem);
  }

  return new InMemoryDesignSystemRegistry(byId);
};

const loadDesignSystem = async (
  folderPath: string,
  folderName: string,
): Promise<LoadedDesignSystem> => {
  const raw = await readFile(path.join(folderPath, "design-system.json"), "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${folderName}/design-system.json: ${messageFrom(error)}`, {
      cause: error,
    });
  }

  const result = designSystemSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Invalid Design System in ${folderName}/design-system.json: ${z.prettifyError(result.error)}`,
    );
  }

  if (result.data.id !== folderName) {
    throw new Error(`Design System folder '${folderName}' does not match id '${result.data.id}'`);
  }

  validateDesignSystemReferences(result.data);
  const resolved = await resolveMcpDesignSystem(result.data, folderPath);
  return deepFreeze({ source: result.data, ...resolved });
};

class InMemoryDesignSystemRegistry implements DesignSystemRegistry {
  constructor(private readonly byId: ReadonlyMap<string, LoadedDesignSystem>) {}

  listDesignSystems = (): readonly DesignSystemSummary[] =>
    [...this.byId.values()].map(({ source }) => toSummary(source));

  getDesignSystem = (designSystemId: string): McpDesignSystem => {
    const designSystem = this.loadedDesignSystem(designSystemId);
    return deepFreeze(designSystem.mcp);
  };

  materializeBrandKitAssets = async ({
    designSystemId,
    outputDirectory,
    assetHandles,
    overwrite,
  }: MaterializeBrandKitAssetsRequest): Promise<MaterializedBrandKitAssets> => {
    const designSystem = this.loadedDesignSystem(designSystemId);
    return designSystem.assetIndex.materialize({
      outputDirectory,
      assetHandles,
      overwrite,
    });
  };

  private loadedDesignSystem = (designSystemId: string): LoadedDesignSystem => {
    const designSystem = this.byId.get(designSystemId);
    if (!designSystem) {
      throw new UnknownDesignSystemError(designSystemId);
    }
    return designSystem;
  };
}

const resolveMcpDesignSystem = async (
  designSystem: DesignSystem,
  folderPath: string,
): Promise<Readonly<{ mcp: McpDesignSystem; assetIndex: BrandKitAssetIndex }>> => {
  const { mcpBrandKit, assetIndex } = await resolveBrandKitAssets({
    designSystemId: designSystem.id,
    folderPath,
    brandKit: designSystem.brandKit,
  });

  return {
    mcp: {
      designSystem: toSummary(designSystem),
      brandKit: mcpBrandKit,
      presentationKit: await resolveMcpPresentationKit(designSystem, folderPath),
    },
    assetIndex,
  };
};

const resolveMcpPresentationKit = async (
  designSystem: DesignSystem,
  folderPath: string,
): Promise<McpPresentationKit> => {
  const { designPrompt, ...presentationKit } = designSystem.presentationKit;
  if (designPrompt === undefined) {
    return presentationKit;
  }

  return {
    ...presentationKit,
    designPrompt: await readFile(path.resolve(folderPath, designPrompt), "utf8"),
  };
};

const validateDesignSystemReferences = (designSystem: DesignSystem): void => {
  ensureUniqueColorTokenIds(designSystem.brandKit.colors, { designSystemId: designSystem.id });
};

const toSummary = (
  designSystem: Pick<DesignSystem, "id" | "name" | "description">,
): DesignSystemSummary =>
  designSystem.description === undefined
    ? { id: designSystem.id, name: designSystem.name }
    : { id: designSystem.id, name: designSystem.name, description: designSystem.description };

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value;
};

const messageFrom = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
