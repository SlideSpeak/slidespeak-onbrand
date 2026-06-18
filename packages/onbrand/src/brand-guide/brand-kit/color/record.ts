import type { ColorToken as DbColorToken } from "@prisma/client";
import type { ColorToken } from "./index";

export const COLOR_TOKENS_ORDER_BY = { sortOrder: "asc" } as const;

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

export const toColorTokenCreateRecords = (colors: readonly ColorToken[]) =>
  colors.map((color, index) => ({
    tokenId: color.id,
    name: color.name,
    value: color.value,
    description: color.description,
    sortOrder: index,
  }));
