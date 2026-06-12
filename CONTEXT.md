# SlideSpeak Onbrand

SlideSpeak Onbrand provides governed design knowledge that AI agents can use to create materials
that remain consistent with an organization's identity and presentation conventions.

## Language

**Onbrand**: The product that gives AI agents access to an organization's governed design knowledge.
_Avoid_: Brand MCP, branding tool

**Design System**: The canonical source of truth for an organization's reusable design assets and
design rules. In this context, each Design System contains one **Brand Kit** and one **Presentation
Kit**. _Avoid_: Design context, brand, brand definition

**Brand Kit**: The identity-focused part of a **Design System**, such as colors, logos, typography,
**Decorative Assets**, imagery, icons, and voice/tone. _Avoid_: Brand, brand assets when referring
to the whole kit

**Logo**: The governed brand logo in a **Brand Kit**. Presentation-specific logo uses reference the
Brand Kit logo rather than redefining logo source details in the Presentation Kit. _Avoid_: Logo
Asset, logo variant

**Decorative Asset**: A reusable, non-semantic, brand-approved visual accent in a **Brand Kit**,
such as a shape, pattern, texture, divider, flourish, or background accent. It is optional to use,
reusable within generated materials and across non-slide materials, and treated as a finished
artifact rather than an editable template; variants are represented as separate Decorative Assets
rather than by transforming the asset. It may support foreground accent or background use based on
its usage guidance, but it must not be the only carrier of information. It is distinct from
**Logo**, future Icon, and future Image concepts; the boundary is decorative purpose, not file
format. _Avoid_: Brand image, icon, illustration

**Materialized Brand Kit Asset**: A local copy of a declared visual from a **Brand Kit** that
generated artifacts can reference. Current materializable visuals are the **Logo** and **Decorative
Assets**. The materialized copy is produced from the persisted Brand Kit Asset bytes in the Design
System Registry. _Avoid_: MCP Resource, source asset path

**Presentation Kit**: The slide-focused part of a **Design System**. It defines the **Slide Canvas**
and may include a **Design Prompt** for generated presentations. _Avoid_: Slide Kit, Template Kit,
Deck Kit

**Design Prompt**: Narrative presentation guidance that captures brand-specific slide design rules,
layout grammar, copy style, and quality checks for AI agents. _Avoid_: Master prompt, system prompt

**Slide Canvas**: The canonical coordinate space used by a **Presentation Kit** to describe slide
size and aspect ratio. _Avoid_: Page size, viewport, artboard

**Color Token**: A named color in a **Brand Kit** that includes both a precise color value and
descriptive guidance about its role. Color Token IDs are unique within a Brand Kit, not globally.
_Avoid_: Color swatch when referring to role-aware colors

## Example dialogue

**Developer**: Should the agent fetch the brand before creating slides?

**Domain expert**: Fetch the Design System. The Brand Kit is only the identity layer; slide-specific
conventions may live outside it.

**Developer**: Should the agent use the raw blue hex value directly?

**Domain expert**: It should use the Color Token when possible, because the token explains the role
of the color as well as its value.
