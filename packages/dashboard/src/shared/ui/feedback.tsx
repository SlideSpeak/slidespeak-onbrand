export const ErrorMessage = ({ message }: Readonly<{ message: string }>) => (
  <div className="col-span-full rounded-md border border-onbrand-charcoal/25 bg-transparent p-5">
    <h2>Something went wrong</h2>
    <p className="leading-6 text-onbrand-charcoal/70">{message}</p>
  </div>
);
