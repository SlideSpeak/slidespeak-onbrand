import type { ColorToken } from "../color/index";

export const colorTokensPrismaOrderBy = { sortOrder: "asc" } as const;

export type StoredColorToken = Readonly<{
  tokenId: string;
  name: string;
  value: string;
  description: string;
}>;

export const toColorToken = ({
  tokenId,
  name,
  value,
  description,
}: StoredColorToken): ColorToken => ({
  id: tokenId,
  name,
  value,
  description,
});
