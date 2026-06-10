# No shallow pass-through modules

## Flag when

- A new function or module only forwards to another module with the same inputs and output.
- A wrapper exists mainly to make tests easier, but adds no domain behavior.
- The interface is nearly as complex as the implementation and does not hide validation, translation, policy, orchestration, or error handling.

## Do not flag

- Adapters that translate between real seams, such as transport formats and domain modules.
- Small helpers that encapsulate repeated formatting, validation, or error translation.
- Public exports that intentionally stabilize a package interface while hiding internal file structure.

## Why

Shallow modules reduce locality and make the codebase harder to navigate without adding leverage.

## Fix

Inline the pass-through call, or deepen the module by moving meaningful behavior behind the interface.
