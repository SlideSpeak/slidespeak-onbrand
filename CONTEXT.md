# SlideSpeak Onbrand

SlideSpeak Onbrand provides governed design knowledge that AI agents can use to create materials
that remain consistent with an organization's identity and presentation conventions.

## Language

**Onbrand**: The product that gives AI agents access to an organization's governed design knowledge.
_Avoid_: Brand MCP, branding tool

**Brand Guide**: The canonical source of truth for an organization's reusable design assets and
design rules. In this context, each Brand Guide contains one **Brand Kit** and one **Presentation
Kit**. _Avoid_: Design context, brand, brand definition

**Brand Guide Registry**: The persistence module that lists, loads, and replaces **Brand Guides**,
including their **Brand Kit**, **Brand Kit Asset File** records, and **Presentation Kit** records.
Its interface is the seam between Onbrand application workflows and the Prisma Postgres adapter.
_Avoid_: Brand Guide service, repository when discussing the domain concept

**Brand Kit**: The identity-focused part of a **Brand Guide**, such as colors, logos, typography,
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

**Brand Kit Asset File**: The exact downloadable file and metadata for a declared visual from a
**Brand Kit** that an MCP client can write into its own workspace. Current downloadable visuals are
the **Logo** and **Decorative Assets**. The file lives in S3 object storage and is exposed to
clients through short-lived presigned URLs. Its module owns storage-key validation, asset handles,
supported MIME types, materialization commands, and dashboard preview paths. _Avoid_: server-local
path, source asset path, inline binary payload

**Presentation Kit**: The slide-focused part of a **Brand Guide**. It defines the **Slide Canvas**
and may include a **Design Prompt** for generated presentations. _Avoid_: Slide Kit, Template Kit,
Deck Kit

**Design Prompt**: Narrative presentation guidance that captures brand-specific slide design rules,
layout grammar, copy style, and quality checks for AI agents. _Avoid_: Master prompt, system prompt

**Onbrand Skill**: General agent guidance that explains what **Onbrand** can do and how an AI agent
should use its tools. It is distinct from a **Design Prompt**, which is specific to one **Brand
Guide**. _Avoid_: Onbrand Orientation, onboarding prompt, discovery prompt, help prompt

**Onbrand Dashboard**: The browser-based Onbrand product surface where authenticated users view and
manage their **Brand Guides**. It is distinct from the MCP endpoint, which is the agent-facing
integration surface. _Avoid_: Admin panel, Brand dashboard, MCP UI

**Slide Canvas**: The canonical coordinate space used by a **Presentation Kit** to describe slide
size and aspect ratio. _Avoid_: Page size, viewport, artboard

**Color Token**: A named color in a **Brand Kit** that includes both a precise color value and
descriptive guidance about its role. Color Token IDs are unique within a Brand Kit, not globally.
_Avoid_: Color swatch when referring to role-aware colors

## Example dialogue

**Developer**: Should the agent fetch the brand before creating slides?

**Domain expert**: Fetch the Brand Guide. The Brand Kit is only the identity layer; slide-specific
conventions may live outside it.

**Developer**: Should the agent use the raw blue hex value directly?

**Domain expert**: It should use the Color Token when possible, because the token explains the role
of the color as well as its value.
