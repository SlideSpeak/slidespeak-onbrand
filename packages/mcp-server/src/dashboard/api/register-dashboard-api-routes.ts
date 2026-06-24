import {
  UnknownBrandGuideError,
  type BrandGuideApplicationService,
} from "@onbrand/core/brand-guide/application-service";
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

  app.post("/api/brand-guides", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.createBrandGuide(
          { ownerUserId: session.ownerUserId },
          await context.req.json(),
        ),
        201,
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });

  app.post("/api/brand-guide-generation-requests", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.createBrandGuideGenerationRequest(
          { ownerUserId: session.ownerUserId },
          await context.req.json(),
        ),
        201,
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });

  app.post("/api/brand-guides/:id/asset-uploads", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.prepareBrandGuideAssetUploads(
          { ownerUserId: session.ownerUserId },
          { ...(await context.req.json()), brandGuideId: context.req.param("id") },
        ),
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
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

  app.get("/api/brand-guides/:id/assets/:assetHandle/preview-proxy", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      const previewUrl = await brandGuides.getBrandKitAssetPreviewUrl(
        { ownerUserId: session.ownerUserId },
        {
          brandGuideId: context.req.param("id"),
          assetHandle: context.req.param("assetHandle"),
        },
      );
      const response = await fetch(previewUrl);
      if (!response.ok || !response.body) return context.text("Asset preview unavailable", 502);
      return new Response(response.body, {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=300",
          "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
        },
      });
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

  app.patch("/api/brand-guides/:id/metadata", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.updateBrandGuideMetadata(
          { ownerUserId: session.ownerUserId },
          { ...(await context.req.json()), brandGuideId: context.req.param("id") },
        ),
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });

  app.delete("/api/brand-guides/:id", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      await brandGuides.deleteBrandGuide(
        { ownerUserId: session.ownerUserId },
        context.req.param("id"),
      );
      return context.body(null, 204);
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });

  app.put("/api/brand-guides/:id/colors", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.upsertColorToken(
          { ownerUserId: session.ownerUserId },
          { ...(await context.req.json()), brandGuideId: context.req.param("id") },
        ),
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });

  app.delete("/api/brand-guides/:id/colors/:name", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.deleteColorToken(
          { ownerUserId: session.ownerUserId },
          { brandGuideId: context.req.param("id"), name: context.req.param("name") },
        ),
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });

  app.put("/api/brand-guides/:id/logo", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.upsertLogo(
          { ownerUserId: session.ownerUserId },
          { brandGuideId: context.req.param("id"), asset: await context.req.json() },
        ),
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });

  app.delete("/api/brand-guides/:id/logo", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.deleteLogo(
          { ownerUserId: session.ownerUserId },
          { brandGuideId: context.req.param("id") },
        ),
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });

  app.put("/api/brand-guides/:id/decorative-assets", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.upsertDecorativeAsset(
          { ownerUserId: session.ownerUserId },
          { ...(await context.req.json()), brandGuideId: context.req.param("id") },
        ),
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });

  app.delete("/api/brand-guides/:id/decorative-assets/:name", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.deleteDecorativeAsset(
          { ownerUserId: session.ownerUserId },
          { brandGuideId: context.req.param("id"), name: context.req.param("name") },
        ),
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });

  app.patch("/api/brand-guides/:id/presentation-kit", async (context) => {
    try {
      const session = await getDashboardSession(context, refreshConfig);
      return context.json(
        await brandGuides.updatePresentationKit(
          { ownerUserId: session.ownerUserId },
          { brandGuideId: context.req.param("id"), presentationKit: await context.req.json() },
        ),
      );
    } catch (error) {
      return handleDashboardApiError(context, error, handleAuthError);
    }
  });
};

const handleDashboardApiError = (
  context: Context,
  error: unknown,
  handleAuthError: (context: Context, error: unknown) => Response,
): Response => {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof UnknownBrandGuideError || isPrismaRecordNotFoundError(error)) {
    return context.text(message, 404);
  }
  if (
    isPrismaUniqueConstraintError(error) ||
    message.includes("Duplicate") ||
    message.includes("Invalid") ||
    message.includes("must")
  ) {
    return context.text(message, 400);
  }
  return handleAuthError(context, error);
};

const isPrismaRecordNotFoundError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2025";

const isPrismaUniqueConstraintError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
