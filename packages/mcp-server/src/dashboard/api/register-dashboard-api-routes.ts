import type { DesignSystemApplicationService } from "@onbrand/core/design-system/application-service";
import type { Hono } from "hono";
import type { Context } from "hono";
import { getDashboardSession, type DashboardSessionRefreshConfig } from "../dashboard-session";

export type DashboardApiRoutesConfig = Readonly<{
  app: Hono;
  designSystems: DesignSystemApplicationService;
  handleAuthError: (context: Context, error: unknown) => Response;
  refreshConfig: DashboardSessionRefreshConfig;
}>;

export const registerDashboardApiRoutes = ({
  app,
  designSystems,
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

  app.get("/api/design-systems", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await designSystems.listDesignSystems({ ownerUserId: session.ownerUserId }),
      );
    } catch (error) {
      return handleAuthError(context, error);
    }
  });

  app.get("/api/design-systems/:id/assets/:assetHandle/preview", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      const previewUrl = await designSystems.getBrandKitAssetPreviewUrl(
        { ownerUserId: session.ownerUserId },
        {
          designSystemId: context.req.param("id"),
          assetHandle: context.req.param("assetHandle"),
        },
      );
      return context.redirect(previewUrl, 302);
    } catch (error) {
      return handleAuthError(context, error);
    }
  });

  app.get("/api/design-systems/:id", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await designSystems.getDesignSystem(
          { ownerUserId: session.ownerUserId },
          context.req.param("id"),
        ),
      );
    } catch (error) {
      return handleAuthError(context, error);
    }
  });
};
