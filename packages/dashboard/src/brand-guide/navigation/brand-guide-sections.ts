import type { IconSvgElement } from "@hugeicons/react";
import {
  ColorsIcon,
  GeometricShapesIcon,
  PresentationIcon,
  SealIcon,
} from "@hugeicons/core-free-icons";

export type BrandGuideSection = "COLORS" | "LOGO" | "ASSETS" | "PRESENTATION";

export const DEFAULT_BRAND_GUIDE_SECTION: BrandGuideSection = "COLORS";

export const BRAND_GUIDE_SECTION_LINKS = [
  { section: "COLORS", pathSegment: "colors", label: "Colors", icon: ColorsIcon },
  { section: "LOGO", pathSegment: "logo", label: "Logo", icon: SealIcon },
  {
    section: "ASSETS",
    pathSegment: "assets",
    label: "Decorative Assets",
    icon: GeometricShapesIcon,
  },
  {
    section: "PRESENTATION",
    pathSegment: "presentation",
    label: "Presentation Kit",
    icon: PresentationIcon,
  },
] as const satisfies readonly {
  section: BrandGuideSection;
  pathSegment: string;
  label: string;
  icon: IconSvgElement;
}[];

export const brandGuideSectionFromPathSegment = (segment: string | undefined): BrandGuideSection =>
  BRAND_GUIDE_SECTION_LINKS.find((link) => link.pathSegment === segment)?.section ??
  DEFAULT_BRAND_GUIDE_SECTION;

export const brandGuideSectionLabel = (section: BrandGuideSection): string =>
  BRAND_GUIDE_SECTION_LINKS.find((link) => link.section === section)?.label ?? section;

export const brandGuideSectionPathSegment = (section: BrandGuideSection): string =>
  BRAND_GUIDE_SECTION_LINKS.find((link) => link.section === section)?.pathSegment ??
  BRAND_GUIDE_SECTION_LINKS[0].pathSegment;
