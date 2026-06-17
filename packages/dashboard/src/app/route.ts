import {
  designSystemSectionFromPathSegment,
  type DesignSystemSection,
} from "../design-system/navigation/design-system-sections";

export type DashboardRoute = Readonly<{
  selectedDesignSystemId?: string;
  selectedDesignSystemSection?: DesignSystemSection;
}>;

export const routeFromPathname = (pathname: string): DashboardRoute => {
  const match = pathname.match(/^\/design-systems\/([^/]+)(?:\/([^/]+))?$/u);
  return {
    selectedDesignSystemId: match ? decodeURIComponent(match[1]) : undefined,
    selectedDesignSystemSection: match ? designSystemSectionFromPathSegment(match[2]) : undefined,
  };
};
