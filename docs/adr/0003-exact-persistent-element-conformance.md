# Exact Persistent Element conformance

Persistent Layout Elements that are present in a Conformance Manifest must match their Design System
definition exactly, including placement, with no tolerance or fuzzy matching. We considered a small
pixel tolerance for renderer rounding, but Onbrand's purpose is precise brand governance for
recurring slide elements such as logos and slide numbers, so variation is treated as a conformance
failure rather than acceptable noise.
