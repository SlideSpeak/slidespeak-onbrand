import {
  brandGuideSectionFromPathSegment,
  type BrandGuideSection,
} from "../brand-guide/navigation/brand-guide-sections";

export type DashboardRoute = Readonly<{
  selectedBrandGuideId?: string;
  selectedBrandGuideSection?: BrandGuideSection;
}>;

export const routeFromPathname = (pathname: string): DashboardRoute => {
  const match = pathname.match(/^\/brand-guides\/([^/]+)(?:\/([^/]+))?$/u);
  return {
    selectedBrandGuideId: match ? decodeURIComponent(match[1]) : undefined,
    selectedBrandGuideSection: match ? brandGuideSectionFromPathSegment(match[2]) : undefined,
  };
};
