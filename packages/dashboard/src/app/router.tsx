import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { DashboardApp, OnboardingPage } from "./dashboard-app";

const ROOT_ROUTE = createRootRoute({ component: Outlet });

const INDEX_ROUTE = createRoute({
  getParentRoute: () => ROOT_ROUTE,
  path: "/",
  component: DashboardApp,
});

const ONBOARD_ROUTE = createRoute({
  getParentRoute: () => ROOT_ROUTE,
  path: "/onboard",
  component: OnboardingPage,
});

const BRAND_GUIDES_ROUTE = createRoute({
  getParentRoute: () => ROOT_ROUTE,
  path: "/brand-guides",
  component: DashboardApp,
});

const BRAND_GUIDE_ROUTE = createRoute({
  getParentRoute: () => ROOT_ROUTE,
  path: "/brand-guides/$brandGuideId",
  component: DashboardApp,
});

const BRAND_GUIDE_SECTION_ROUTE = createRoute({
  getParentRoute: () => ROOT_ROUTE,
  path: "/brand-guides/$brandGuideId/$section",
  component: DashboardApp,
});

const ROUTE_TREE = ROOT_ROUTE.addChildren([
  INDEX_ROUTE,
  ONBOARD_ROUTE,
  BRAND_GUIDES_ROUTE,
  BRAND_GUIDE_ROUTE,
  BRAND_GUIDE_SECTION_ROUTE,
]);

export const ROUTER = createRouter({ routeTree: ROUTE_TREE });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof ROUTER;
  }
}
