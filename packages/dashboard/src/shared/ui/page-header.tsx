import type React from "react";

export const PageHeader = ({
  action,
  description,
  title,
}: Readonly<{ action?: React.ReactNode; description?: string; title: string }>) => (
  <header className="mb-2 flex items-start justify-between gap-3">
    <div className="grid gap-1">
      <h2 className="m-0 text-xl leading-none font-normal tracking-[-0.035em]">{title}</h2>
      {description ? (
        <p className="m-0 max-w-xl text-sm leading-5 text-onbrand-charcoal/55">{description}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </header>
);
