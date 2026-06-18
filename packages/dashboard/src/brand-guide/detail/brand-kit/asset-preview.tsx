export const AssetPreview = ({
  alt,
  className = "h-auto w-full object-cover",
  src,
}: Readonly<{ alt: string; className?: string; src: string }>) => (
  <img alt={alt} className={className} src={src} />
);
