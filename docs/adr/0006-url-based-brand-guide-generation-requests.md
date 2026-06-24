# URL-based Brand Guide Creation

The Onbrand Dashboard starts URL-based Brand Guide creation from a Source URL and immediately
creates the editable Brand Guide once extraction completes. The Dashboard shows a minimal loading
state while the Source URL is studied, then routes directly to the new Brand Guide's Logo section.

We do not persist a separate Brand Guide Generation Request table. The current workflow has no
background queue or retry surface, so a persisted request row would add schema and lifecycle
complexity without giving the user a useful status resource. The POST endpoint can still return a
completed, response-only generation shape for the Dashboard redirect, but the Brand Guide is the
only durable domain object created by the flow.
