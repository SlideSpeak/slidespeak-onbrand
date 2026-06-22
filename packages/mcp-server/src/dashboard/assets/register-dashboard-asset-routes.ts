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
const DASHBOARD_PUBLIC_URL_PLACEHOLDER = "__ONBRAND_PUBLIC_URL__";
const DASHBOARD_PUBLIC_IMAGE_URL_PLACEHOLDER = "__ONBRAND_PUBLIC_IMAGE_URL__";
const DASHBOARD_PUBLIC_ASSET_PATHS = ["/onbrand-banner.webp"] as const;
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
  "/dashboard",
  "/dashboard/*",
  "/brand-guides",
  "/brand-guides/:id",
  "/brand-guides/:id/:section",
] as const;

export const registerDashboardAssetRoutes = (app: Hono): void => {
  if (Env.DASHBOARD_DEV_SERVER_URL) {
    DASHBOARD_DEV_SERVER_PATHS.forEach((path) => app.get(path, proxyDashboardDevServer));
  }

  DASHBOARD_PUBLIC_ASSET_PATHS.forEach((path) =>
    app.get(path, async (context) => {
      if (Env.DASHBOARD_DEV_SERVER_URL) return proxyDashboardDevServer(context);
      const filePath = dashboardAssetFilePath(context.req.path.slice(1));
      if (!filePath || !existsSync(filePath)) return context.notFound();
      return serveDashboardAsset(context, filePath);
    }),
  );
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
    ".webp": "image/webp",
  };
  return context.body(body, 200, {
    "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
  });
};

const proxyDashboardDevServer = async (context: Context): Promise<Response> => {
  if (!Env.DASHBOARD_DEV_SERVER_URL) {
    return serveDashboardIndex(context);
  }

  const devServerUrl = new URL(context.req.url);
  const targetUrl = new URL(context.req.path + devServerUrl.search, Env.DASHBOARD_DEV_SERVER_URL);
  try {
    const response = await fetch(targetUrl, {
      headers: context.req.raw.headers,
      method: context.req.method,
    });
    if (!response.headers.get("content-type")?.includes("text/html")) return response;

    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(renderDashboardIndex(await response.text(), Env.BASE_URL), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    return context.text("Dashboard dev server is not reachable. Start onbrand-dashboard.", 503);
  }
};

const serveDashboard = async (context: Context): Promise<Response> =>
  Env.DASHBOARD_DEV_SERVER_URL ? proxyDashboardDevServer(context) : serveDashboardIndex(context);

const serveDashboardIndex = async (context: Context): Promise<Response> =>
  context.body(
    renderDashboardIndex(
      await readFile(dashboardAssetFilePath("index.html")!, "utf8"),
      Env.BASE_URL,
    ),
    200,
    {
      "Content-Type": "text/html; charset=utf-8",
    },
  );

export const renderDashboardIndex = (html: string, baseUrl: string): string => {
  const publicUrl = new URL("/", baseUrl).toString();
  const publicImageUrl = new URL("/onbrand-banner.webp", publicUrl).toString();
  return html
    .replaceAll(DASHBOARD_PUBLIC_URL_PLACEHOLDER, publicUrl)
    .replaceAll(DASHBOARD_PUBLIC_IMAGE_URL_PLACEHOLDER, publicImageUrl);
};
