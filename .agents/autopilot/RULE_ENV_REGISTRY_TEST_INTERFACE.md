# Env registry tests use the Env interface

## Flag when

- A test or example creates an environment registry under a generic name such as `registry` or
  `testRegistry`.
- Env package tests validate behavior without exercising the public `Env.X` property access style.
- Assertions call registry helpers through a name that does not resemble the application-facing
  `Env` interface.

## Do not flag

- Internal helper variables that are not themselves the created env registry.
- Tests for lower-level env definition functions where no registry is created.
- Non-env packages that use a local registry concept unrelated to environment variables.

## Why

The environment registry is consumed as `Env.X` in application code. Tests should document and
exercise that public interface instead of a test-only registry shape.

## Fix

Name the created registry `Env` and exercise behavior through `Env.<VARIABLE>`, `Env.validate(...)`,
and `Env.formatReport(...)`.
