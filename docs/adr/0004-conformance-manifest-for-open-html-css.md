# Conformance Manifest for open HTML/CSS slides

Agents may generate arbitrary creative HTML/CSS for slide content, and Onbrand will not require a
full JSON representation of every slide element. Presentation Conformance Checks operate on a
minimal Conformance Manifest that declares only Design System-governed Persistent Layout Element
uses per slide; the agent/client is responsible for keeping the emitted HTML/CSS faithful to that
manifest. We chose this over raw HTML/CSS inspection or a complete slide DSL so Onbrand can enforce
precise recurring brand elements without becoming a renderer or limiting model creativity.
