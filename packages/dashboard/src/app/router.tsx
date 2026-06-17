import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { DashboardApp, OnboardingPage } from "./dashboard-app";

const ROOT_ROUTE = createRootRoute({ component: Outlet });

const INDEX_ROUTE = createRoute({
  getParentRoute: () => ROOT_ROUTE,
  path: "/",
  component: OnboardingPage,
});

const DESIGN_SYSTEMS_ROUTE = createRoute({
  getParentRoute: () => ROOT_ROUTE,
  path: "/design-systems",
  component: DashboardApp,
});

const DESIGN_SYSTEM_ROUTE = createRoute({
  getParentRoute: () => ROOT_ROUTE,
  path: "/design-systems/$designSystemId",
  component: DashboardApp,
});

const DESIGN_SYSTEM_SECTION_ROUTE = createRoute({
  getParentRoute: () => ROOT_ROUTE,
  path: "/design-systems/$designSystemId/$section",
  component: DashboardApp,
});

const ROUTE_TREE = ROOT_ROUTE.addChildren([
  INDEX_ROUTE,
  DESIGN_SYSTEMS_ROUTE,
  DESIGN_SYSTEM_ROUTE,
  DESIGN_SYSTEM_SECTION_ROUTE,
]);

export const ROUTER = createRouter({ routeTree: ROUTE_TREE });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof ROUTER;
  }
}
