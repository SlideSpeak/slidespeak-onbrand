# Slide-focused Brand Guide tool

SlideSpeak Onbrand is focused on guiding slide generation, so MCP clients should fetch the whole
Brand Guide rather than only the Brand Kit. We will keep the API surface small with
`list_brand_guides` and `get_brand_guide`; `get_brand_kit` is removed so agents always receive the
Brand Kit together with the Presentation Kit and cannot miss slide-specific context such as the
Slide Canvas.
