import type { IconSvgElement } from "@hugeicons/react";
import {
  ColorsIcon,
  GeometricShapesIcon,
  PresentationIcon,
  SealIcon,
} from "@hugeicons/core-free-icons";

export type DesignSystemSection = "COLORS" | "LOGO" | "ASSETS" | "PRESENTATION";

export const DEFAULT_DESIGN_SYSTEM_SECTION: DesignSystemSection = "COLORS";

export const DESIGN_SYSTEM_SECTION_LINKS = [
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
  section: DesignSystemSection;
  pathSegment: string;
  label: string;
  icon: IconSvgElement;
}[];

export const designSystemSectionFromPathSegment = (
  segment: string | undefined,
): DesignSystemSection => {
  if (segment === "prompt") return "PRESENTATION";

  return (
    DESIGN_SYSTEM_SECTION_LINKS.find((link) => link.pathSegment === segment)?.section ??
    DEFAULT_DESIGN_SYSTEM_SECTION
  );
};

export const designSystemSectionLabel = (section: DesignSystemSection): string =>
  DESIGN_SYSTEM_SECTION_LINKS.find((link) => link.section === section)?.label ?? section;

export const designSystemSectionPathSegment = (section: DesignSystemSection): string =>
  DESIGN_SYSTEM_SECTION_LINKS.find((link) => link.section === section)?.pathSegment ??
  DESIGN_SYSTEM_SECTION_LINKS[0].pathSegment;
