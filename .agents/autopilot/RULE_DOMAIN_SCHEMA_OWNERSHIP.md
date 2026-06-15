# Domain schema ownership

## Flag when

- A domain schema is exported as a direct alias of another domain schema only because the current
  shape matches.
- A domain concept imports another domain concept's id/value schema instead of depending on a shared
  primitive.
- A generic primitive schema such as a slug, hex color, URL, or checksum is redeclared locally instead
  of using an existing shared schema package.
- The alias makes one domain concept appear owned by another unrelated domain concept.

## Do not flag

- Multiple domain schemas composing the same shared primitive schema, such as a slug or hex value.
- Intentional aliases inside the same domain module where the names describe the same concept.
- Re-exports that stabilize a public package interface without changing ownership.

## Why

Schemas encode domain ownership. Borrowing another domain's schema creates misleading coupling and
makes future divergence harder.

## Fix

Extract or import a shared primitive schema, or define a domain-owned schema that composes the
primitive. Reuse existing generic shared schemas instead of redeclaring equivalent regexes or
validators locally.
