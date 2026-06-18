# Uppercase constants and string literal contracts

## Flag when

- A module-level constant that represents a stable value is named in `camelCase` or `PascalCase`
  instead of `UPPERCASE_SNAKE_CASE`.
- A string literal union used as a machine-readable contract uses lowercase snake-case, camelCase,
  or PascalCase values.
- A public result/status/error/code value is made uppercase only by assigning a lowercase string to
  an uppercase constant.

## Do not flag

- Ordinary local variables, parameters, functions, or inferred values.
- JSON object field names, tool names, schema property names, or external protocol values that must
  remain in their required wire format.
- Domain enum values that intentionally model authored brand-guide data, such as `required`,
  `optional`, `logo`, or `slideNumber`.

## Why

Stable constants and machine-readable string contracts should be visually distinct and consistent in
reviews and downstream integrations.

## Fix

Rename stable constants to `UPPERCASE_SNAKE_CASE`. For string literal contract unions, make the
literal values themselves `UPPERCASE_SNAKE_CASE` instead of hiding lowercase strings behind
uppercase constant names.
