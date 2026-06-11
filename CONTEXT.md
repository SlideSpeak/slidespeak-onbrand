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
imagery, icons, and voice/tone. _Avoid_: Brand, brand assets when referring to the whole kit

**Logo**: The governed brand logo in a **Brand Kit**. Presentation-specific logo uses reference the
Brand Kit logo rather than redefining logo source details in the Presentation Kit. _Avoid_: Logo
Asset, logo variant

**Presentation Kit**: The slide-focused part of a **Design System**. It currently defines the
**Slide Canvas** for generated presentations. _Avoid_: Slide Kit, Template Kit, Deck Kit

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
