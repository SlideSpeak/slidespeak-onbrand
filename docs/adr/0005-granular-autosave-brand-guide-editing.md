# Granular Autosave Brand Guide Editing

The Onbrand Dashboard will edit Brand Guides with granular autosave patch operations rather than reusing the existing whole-aggregate `writeBrandGuide` flow. Inline dashboard edits can change metadata, Brand Kit content, Presentation Kit content, and asset references independently; whole-aggregate writes would make stale autosaves capable of overwriting unrelated sections. Granular patches keep create/edit/delete smooth in the browser while preserving sparse Brand Guides whose Brand Kit or Presentation Kit may be empty.
