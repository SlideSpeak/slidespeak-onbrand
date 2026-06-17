export const EmptyState = () => (
  <div className="col-span-full rounded-md border border-onbrand-charcoal/10 bg-transparent p-5">
    <h2>No Design Systems yet</h2>
    <p className="leading-6 text-onbrand-charcoal/70">
      Your governed Design Systems will appear here once they are created.
    </p>
  </div>
);

export const ErrorMessage = ({ message }: Readonly<{ message: string }>) => (
  <div className="col-span-full rounded-md border border-onbrand-charcoal/25 bg-transparent p-5">
    <h2>Something went wrong</h2>
    <p className="leading-6 text-onbrand-charcoal/70">{message}</p>
  </div>
);
