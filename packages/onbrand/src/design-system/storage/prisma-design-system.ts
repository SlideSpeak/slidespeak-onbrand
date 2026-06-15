import type { PrismaClient } from "@prisma/client";
import type { AuthContext } from "../../auth/context";
import { UnknownDesignSystemError, type DesignSystemView } from "../application-service";
import { brandKitPrismaInclude, toBrandKitView } from "../brand-kit/db";
import { toPresentationKitView } from "../presentation-kit/storage/prisma-presentation-kit";

export const listDesignSystemSummaries = async (prisma: PrismaClient, auth: AuthContext) => {
  const rows = await prisma.designSystem.findMany({
    where: { ownerUserId: auth.ownerUserId },
    orderBy: { id: "asc" },
  });
  return rows.map((row) => ({ id: row.slug, name: row.name, description: row.description }));
};

export const loadStoredDesignSystem = async (
  prisma: PrismaClient,
  auth: AuthContext,
  designSystemId: string,
) => {
  const row = await prisma.designSystem.findUnique({
    where: { ownerUserId_slug: { ownerUserId: auth.ownerUserId, slug: designSystemId } },
    include: {
      brandKit: { include: brandKitPrismaInclude },
      presentationKit: true,
    },
  });
  if (!row || !row.brandKit || !row.presentationKit) {
    throw new UnknownDesignSystemError(designSystemId);
  }
  return row;
};

export const toDesignSystemView = (
  stored: Awaited<ReturnType<typeof loadStoredDesignSystem>>,
): DesignSystemView => ({
  designSystem: { id: stored.slug, name: stored.name, description: stored.description },
  brandKit: toBrandKitView(stored.brandKit!.assets, stored.brandKit!.colors),
  presentationKit: toPresentationKitView(stored.presentationKit!),
});
