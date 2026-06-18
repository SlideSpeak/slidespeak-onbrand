import type { BrandGuideApplicationService } from "@onbrand/core/brand-guide/application-service";
import type { Hono } from "hono";
import type { Context } from "hono";
import { getDashboardSession, type DashboardSessionRefreshConfig } from "../dashboard-session";

export type DashboardApiRoutesConfig = Readonly<{
  app: Hono;
  brandGuides: BrandGuideApplicationService;
  handleAuthError: (context: Context, error: unknown) => Response;
  refreshConfig: DashboardSessionRefreshConfig;
}>;

export const registerDashboardApiRoutes = ({
  app,
  brandGuides,
  handleAuthError,
  refreshConfig,
}: DashboardApiRoutesConfig): void => {
  app.get("/api/me", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json({ ownerUserId: session.ownerUserId, scopes: session.scopes });
    } catch (error) {
      return handleAuthError(context, error);
    }
  });

  app.get("/api/brand-guides", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(await brandGuides.listBrandGuides({ ownerUserId: session.ownerUserId }));
    } catch (error) {
      return handleAuthError(context, error);
    }
  });

  app.get("/api/brand-guides/:id/assets/:assetHandle/preview", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      const previewUrl = await brandGuides.getBrandKitAssetPreviewUrl(
        { ownerUserId: session.ownerUserId },
        {
          brandGuideId: context.req.param("id"),
          assetHandle: context.req.param("assetHandle"),
        },
      );
      return context.redirect(previewUrl, 302);
    } catch (error) {
      return handleAuthError(context, error);
    }
  });

  app.get("/api/brand-guides/:id", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.getBrandGuide(
          { ownerUserId: session.ownerUserId },
          context.req.param("id"),
        ),
      );
    } catch (error) {
      return handleAuthError(context, error);
    }
  });
};
