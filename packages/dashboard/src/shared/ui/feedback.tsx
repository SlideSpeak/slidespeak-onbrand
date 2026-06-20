export const ErrorMessage = ({ message }: Readonly<{ message: string }>) => (
  <div className="col-span-full rounded-md border border-onbrand-charcoal/18 bg-onbrand-charcoal/[0.025] p-5">
    <h2 className="m-0 text-base font-normal text-onbrand-charcoal">Something went wrong</h2>
    <p className="leading-6 text-onbrand-charcoal/70">{message}</p>
  </div>
);
