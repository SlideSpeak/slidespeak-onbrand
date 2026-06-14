# Keep model prompt and context copy in MDX

## Flag when

- Any `.ts`/code file embeds a prompt, context block, system/developer instruction, model rubric, exemplar, or long natural-language instruction intended for an LLM.
- Adding or changing model-facing copy makes application code hard to scan as code.
- Prompt/context Markdown could be colocated beside the owning feature/tool but is instead stored as a TypeScript template string or large string literal.

## Do not flag

- Short schema field descriptions, enum descriptions, and concise one-line tool descriptions.
- Small user-facing UI labels, error messages, log messages, or domain constants that are not model-facing prompt/context copy.
- Tests that assert important snippets from loaded prompt/context content.
- Dynamic prompt assembly code when the substantial static text lives in `.mdx` files.

## Why

Code should own registration, schemas, auth, orchestration, and prompt assembly. Substantial model-facing prompt/context copy belongs in reviewable Markdown/MDX files so it can be edited, diffed, and maintained as prose.

## Fix

Move substantial model-facing prompt/context content into a colocated `.mdx` file and load it as a string, using a shared file helper when possible.
