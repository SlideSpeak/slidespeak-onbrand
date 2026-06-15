import type { ColorToken as DbColorToken } from "@prisma/client";
import type { ColorToken } from "../color/index";

export const colorTokensOrderBy = { sortOrder: "asc" } as const;

export type ColorTokenRecord = Readonly<
  Pick<DbColorToken, "tokenId" | "name" | "value" | "description">
>;

export const toColorToken = ({
  tokenId,
  name,
  value,
  description,
}: ColorTokenRecord): ColorToken => ({
  id: tokenId,
  name,
  value,
  description,
});
