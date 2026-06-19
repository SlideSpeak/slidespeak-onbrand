export const brandGuideSlugFromName = (name: string): string => slugFromLabel(name);

export const colorTokenIdFromName = (name: string): string => slugFromLabel(name);

export const decorativeAssetIdFromName = (name: string): string => slugFromLabel(name);

const slugFromLabel = (label: string): string => {
  const slug = label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  if (!/^[a-z]/.test(slug)) throw new Error("Name must start with a letter");
  return slug;
};
