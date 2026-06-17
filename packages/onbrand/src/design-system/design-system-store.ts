import type { DesignSystem as DbDesignSystem, PrismaClient } from "@prisma/client";
import { UnknownDesignSystemError, type DesignSystemView } from "./application-service";
import { BRAND_KIT_INCLUDE, toBrandKitView } from "./brand-kit/record";
import type { DesignSystemOwner } from "./owner";
import { toPresentationKitView } from "./presentation-kit/record";

type DesignSystemSummaryRecord = Readonly<Pick<DbDesignSystem, "slug" | "name" | "description">>;

export const listDesignSystemSummaries = async (prisma: PrismaClient, owner: DesignSystemOwner) => {
  const rows: readonly DesignSystemSummaryRecord[] = await prisma.designSystem.findMany({
    where: { ownerUserId: owner.ownerUserId },
    orderBy: { id: "asc" },
    select: { slug: true, name: true, description: true },
  });
  return rows.map((row) => ({ id: row.slug, name: row.name, description: row.description }));
};

export const loadDesignSystemRecord = async (
  prisma: PrismaClient,
  owner: DesignSystemOwner,
  designSystemId: string,
) => {
  const row = await prisma.designSystem.findUnique({
    where: { ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: designSystemId } },
    include: {
      brandKit: { include: BRAND_KIT_INCLUDE },
      presentationKit: true,
    },
  });
  if (!row || !row.brandKit || !row.presentationKit) {
    throw new UnknownDesignSystemError(designSystemId);
  }
  return row;
};

export const toDesignSystemView = (
  record: Awaited<ReturnType<typeof loadDesignSystemRecord>>,
): DesignSystemView => ({
  designSystem: { id: record.slug, name: record.name, description: record.description },
  brandKit: toBrandKitView(record.brandKit!.assets, record.brandKit!.colors),
  presentationKit: toPresentationKitView(record.presentationKit!),
});
