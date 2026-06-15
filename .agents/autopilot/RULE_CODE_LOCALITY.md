# Maximize code locality

## Flag when

- A new broad module mixes schema, types, rules, persistence mapping, storage helpers, or orchestration for multiple domain sub-concepts.
- A refactor moves a concept into a folder but leaves residual flat/backwards-compatibility files such as `concept.ts`, `asset.ts`, or `storage/*` that remain part of the active import graph.
- Concept-specific DB/persistence mapping lives in a parent catch-all module instead of beside the concept it maps.
- Imports route through old compatibility paths when a concept-local `index.ts`, `db.ts`, or similarly owned module exists.

## Do not flag

- Package-level public exports that intentionally stabilize a package interface while hiding internal file structure.
- Small composition modules whose only job is assembling multiple concept-local pieces into a parent view.
- Shared primitives or infrastructure helpers that are genuinely reused across unrelated concepts.

## Why

This codebase favors locality: the schema, types, rules, and persistence mapping for a domain concept should be easy to find beside that concept.

## Fix

Move concept-owned code into the owning concept folder, usually as `index.ts` for schema/types/rules and `db.ts` for persistence mapping. Delete residual compatibility files and update imports to the concept-local path instead of preserving backwards-compatible paths inside the application code.
