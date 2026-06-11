import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { ensureUniqueColorTokenIds } from "../brand-kit/color";
import { designSystemSchema, type DesignSystem, type DesignSystemSummary } from "../design-system";

export class UnknownDesignSystemError extends Error {
  constructor(readonly designSystemId: string) {
    super(`Unknown Design System: ${designSystemId}`);
    this.name = "UnknownDesignSystemError";
  }
}

export interface DesignSystemRegistry {
  listDesignSystems(): readonly DesignSystemSummary[];
  getDesignSystem(designSystemId: string): Readonly<{
    designSystem: DesignSystemSummary;
    brandKit: DesignSystem["brandKit"];
    presentationKit: DesignSystem["presentationKit"];
  }>;
}

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

  const byId = new Map<string, DesignSystem>();
  for (const designSystem of designSystems) {
    if (byId.has(designSystem.id)) {
      throw new Error(`Duplicate Design System id: ${designSystem.id}`);
    }
    byId.set(designSystem.id, designSystem);
  }

  return new InMemoryDesignSystemRegistry(byId);
};

const loadDesignSystem = async (folderPath: string, folderName: string): Promise<DesignSystem> => {
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
  return deepFreeze(result.data);
};

class InMemoryDesignSystemRegistry implements DesignSystemRegistry {
  constructor(private readonly byId: ReadonlyMap<string, DesignSystem>) {}

  listDesignSystems = (): readonly DesignSystemSummary[] => [...this.byId.values()].map(toSummary);

  getDesignSystem = (
    designSystemId: string,
  ): Readonly<{
    designSystem: DesignSystemSummary;
    brandKit: DesignSystem["brandKit"];
    presentationKit: DesignSystem["presentationKit"];
  }> => {
    const designSystem = this.byId.get(designSystemId);
    if (!designSystem) {
      throw new UnknownDesignSystemError(designSystemId);
    }
    return deepFreeze({
      designSystem: toSummary(designSystem),
      brandKit: designSystem.brandKit,
      presentationKit: designSystem.presentationKit,
    });
  };
}

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
