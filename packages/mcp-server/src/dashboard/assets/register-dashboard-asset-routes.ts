import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Env } from "@onbrand/core/env";
import type { Hono } from "hono";
import type { Context } from "hono";

const DASHBOARD_DIST_DIRECTORY = fileURLToPath(
  new URL("../../../../dashboard/dist", import.meta.url),
);
const DASHBOARD_DEV_SERVER_PATHS = [
  "/src/*",
  "/@vite/*",
  "/@react-refresh",
  "/@fs/*",
  "/@id/*",
  "/node_modules/*",
] as const;
const DASHBOARD_SPA_PATHS = [
  "/",
  "/design-systems",
  "/design-systems/:id",
  "/design-systems/:id/:section",
] as const;

export const registerDashboardAssetRoutes = (app: Hono): void => {
  if (Env.DASHBOARD_DEV_SERVER_URL) {
    DASHBOARD_DEV_SERVER_PATHS.forEach((path) => app.get(path, proxyDashboardDevServer));
  }

  app.get("/assets/*", async (context) => {
    if (Env.DASHBOARD_DEV_SERVER_URL) return proxyDashboardDevServer(context);
    const assetPath = context.req.path.replace(/^\/assets\//u, "assets/");
    const filePath = dashboardAssetFilePath(assetPath);
    if (!filePath || !existsSync(filePath)) return context.notFound();
    return serveDashboardAsset(context, filePath);
  });
  DASHBOARD_SPA_PATHS.forEach((path) => app.get(path, serveDashboard));
};

const dashboardAssetFilePath = (path: string): string | null => {
  const filePath = resolve(DASHBOARD_DIST_DIRECTORY, path);
  const relativePath = relative(DASHBOARD_DIST_DIRECTORY, filePath);
  if (relativePath.startsWith("..") || resolve(relativePath) === relativePath) return null;
  return filePath;
};

const serveDashboardAsset = async (context: Context, filePath: string): Promise<Response> => {
  const body = await readFile(filePath);
  const contentTypes: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
  };
  return context.body(body, 200, {
    "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
  });
};

const proxyDashboardDevServer = async (context: Context): Promise<Response> => {
  if (!Env.DASHBOARD_DEV_SERVER_URL) {
    return serveDashboardAsset(context, dashboardAssetFilePath("index.html")!);
  }

  const devServerUrl = new URL(context.req.url);
  const targetUrl = new URL(context.req.path + devServerUrl.search, Env.DASHBOARD_DEV_SERVER_URL);
  try {
    return await fetch(targetUrl, {
      headers: context.req.raw.headers,
      method: context.req.method,
    });
  } catch {
    return context.text("Dashboard dev server is not reachable. Start onbrand-dashboard.", 503);
  }
};

const serveDashboard = async (context: Context): Promise<Response> =>
  Env.DASHBOARD_DEV_SERVER_URL
    ? proxyDashboardDevServer(context)
    : serveDashboardAsset(context, dashboardAssetFilePath("index.html")!);
