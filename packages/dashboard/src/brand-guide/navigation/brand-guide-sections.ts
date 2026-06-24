import type { IconSvgElement } from "@hugeicons/react";
import {
  ColorsIcon,
  GeometricShapesIcon,
  ClipboardPenLineIcon,
  McpServerIcon,
  PresentationIcon,
  SealIcon,
} from "@hugeicons/core-free-icons";

export type BrandGuideSection = "METADATA" | "COLORS" | "LOGO" | "ASSETS" | "PRESENTATION" | "MCP";

export const DEFAULT_BRAND_GUIDE_SECTION: BrandGuideSection = "COLORS";

export const BRAND_GUIDE_SECTION_LINKS = [
  { section: "METADATA", pathSegment: "details", label: "Details", icon: ClipboardPenLineIcon },
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
  { section: "MCP", pathSegment: "mcp", label: "MCP Connection", icon: McpServerIcon },
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
