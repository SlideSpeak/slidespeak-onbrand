# Infer types from Zod schemas

## Flag when

- A TypeScript object type manually duplicates the shape of a nearby Zod object schema.
- A schema and a hand-written type need to be updated together to stay in sync.
- A narrower type can be derived from an inferred schema type but is written from scratch instead.

## Do not flag

- Types that intentionally describe a different public interface than the validation schema.
- Types for values that are not validated by Zod.
- Small generic helper types that cannot be inferred from a concrete schema.

## Why

Duplicating schemas and types creates drift. Zod is the source of truth for validated data shapes in
this project.

## Fix

Infer the type from the schema with `z.infer<typeof schema>`, then derive narrower types with
TypeScript utilities such as `Pick`, `Omit`, or indexed access when needed.
