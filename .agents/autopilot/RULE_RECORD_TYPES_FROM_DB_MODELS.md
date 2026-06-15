# Derive record types from database models

## Flag when

- A Prisma-backed `*Record` type manually redeclares fields and primitive types that already exist
  on a generated Prisma model.
- A record file imports a Prisma model type without aliasing it with a `Db` prefix.
- A domain type such as `ColorToken`, `BrandKitView`, `DesignSystemView`, or `PresentationKitView`
  is changed to depend directly on a Prisma model type.

## Do not flag

- Narrow `*Record` types expressed as `Readonly<Pick<DbModel, "field" | "field">>`.
- Additional domain-only request/input types that are not persisted records.
- Record types for data that does not come from a generated Prisma model.

## Why

Record types should stay narrow while inheriting field types from the database model they represent.
The `Db*` alias makes the persistence source explicit without letting Prisma become the domain type.

## Fix

Import the generated Prisma model type with a `Db` prefix and define the record as a narrow pick:

```ts
import type { ColorToken as DbColorToken } from "@prisma/client";

export type ColorTokenRecord = Readonly<
  Pick<DbColorToken, "tokenId" | "name" | "value" | "description">
>;
```

Keep canonical domain types independent from Prisma and convert records into domain views through
concept-local mapping functions.
