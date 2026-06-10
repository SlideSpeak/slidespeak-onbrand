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
imagery, icons, voice/tone, and a Design Prompt. _Avoid_: Brand, brand assets when referring to the
whole kit

**Design Prompt**: A Brand Kit field containing extensive, brand-specific instructions for AI agents
that generate HTML/CSS. It translates identity rules into concrete layout, color, typography,
accessibility, and anti-pattern guidance. _Avoid_: Generic prompt, system prompt

**Logo**: The governed brand logo in a **Brand Kit**. Presentation-specific logo uses reference the
Brand Kit logo rather than redefining logo source details in the Presentation Kit. _Avoid_: Logo
Asset, logo variant

**Brand Asset**: A file referenced by a Brand Kit, such as a logo SVG or background SVG, that client
agents should copy into the generated-output folder and reference through local relative paths from
HTML/CSS. _Avoid_: remote dependency, decorative element

**Presentation Kit**: The slide-focused part of a **Design System**, such as persistent layout
elements, slide canvas, spacing conventions, grids, and presentation-specific composition rules. It
guides open-ended slide generation rather than restricting agents to predefined slide layouts.
_Avoid_: Slide Kit, Template Kit, Deck Kit

**Slide Canvas**: The canonical coordinate space used by a **Presentation Kit** to describe slide
size, aspect ratio, and placement. **Persistent Layout Elements** are positioned within the Slide
Canvas. _Avoid_: Page size, viewport, artboard

**Color Token**: A named color in a **Brand Kit** that includes both a precise color value and
descriptive guidance about its role. Color Token IDs are unique within a Brand Kit, not globally.
_Avoid_: Color swatch when referring to role-aware colors

**Persistent Layout Element**: A reusable visual or textual element that a **Presentation Kit**
makes available for generated slides, either as a required element or as an optional governed
element, such as a logo, slide number, header, footer, or decorative shape. Persistent Layout
Element IDs are unique within a Presentation Kit, not globally, and the element is not
author-provided slide content. _Avoid_: Placeholder, asset, decoration

**Usage Policy**: The rule that states whether a **Persistent Layout Element** must be used on every
slide or may be used as an optional governed element. _Avoid_: Visibility, requirement, rule

**Conformance Rule**: A machine-checkable presentation rule in a **Design System** that describes
what generated slides must or must not do. Conformance Rules for **Persistent Layout Elements** are
implied by their **Usage Policies** and definitions rather than redeclared separately. _Avoid_: QA
rule, validation rule, compliance rule

**Presentation Conformance Check**: A binary evaluation of a **Conformance Manifest** against the
applicable **Conformance Rules**. It reports whether generated presentation output passes or fails
the Design System's stated rules. _Avoid_: QA check, validation pass, compliance check

**Conformance Manifest**: A structured declaration of the **Persistent Layout Elements** present in
generated presentation output. It is used for a **Presentation Conformance Check** and is not a
complete representation of the slide's HTML/CSS or authored content. _Avoid_: Candidate
Presentation, HTML output, generated deck when referring to the structured check input

## Example dialogue

**Developer**: Should the agent fetch the brand before creating slides?

**Domain expert**: Fetch the Design System. The Brand Kit is only the identity layer; slide-specific
conventions may live outside it.

**Developer**: Should the agent use the raw blue hex value directly?

**Domain expert**: It should use the Color Token when possible, because the token explains the role
of the color as well as its value.
