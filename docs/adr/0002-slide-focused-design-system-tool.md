# Slide-focused Design System tool

SlideSpeak Onbrand is focused on guiding slide generation, so MCP clients should fetch the whole
Design System rather than only the Brand Kit. We will keep the API surface small with
`list_design_systems` and `get_design_system`; `get_brand_kit` is removed so agents always receive
the Brand Kit together with the Presentation Kit and cannot miss slide-specific requirements such as
Persistent Layout Elements.
