import type { BrandGuide as DbBrandGuide, PrismaClient } from "@prisma/client";
import { UnknownBrandGuideError, type BrandGuideView } from "./application-service";
import { BRAND_KIT_INCLUDE, toBrandKitView } from "./brand-kit/record";
import type { BrandGuideOwner } from "./owner";
import { toPresentationKitView } from "./presentation-kit/record";

type BrandGuideSummaryRecord = Readonly<Pick<DbBrandGuide, "slug" | "name" | "description">>;

export const listBrandGuideSummaries = async (prisma: PrismaClient, owner: BrandGuideOwner) => {
  const rows: readonly BrandGuideSummaryRecord[] = await prisma.brandGuide.findMany({
    where: { ownerUserId: owner.ownerUserId },
    orderBy: { id: "asc" },
    select: { slug: true, name: true, description: true },
  });
  return rows.map((row) => ({ id: row.slug, name: row.name, description: row.description }));
};

export const loadBrandGuideRecord = async (
  prisma: PrismaClient,
  owner: BrandGuideOwner,
  brandGuideId: string,
) => {
  const row = await prisma.brandGuide.findUnique({
    where: { ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: brandGuideId } },
    include: {
      brandKit: { include: BRAND_KIT_INCLUDE },
      presentationKit: true,
    },
  });
  if (!row) {
    throw new UnknownBrandGuideError(brandGuideId);
  }
  return row;
};

export const toBrandGuideView = (
  record: Awaited<ReturnType<typeof loadBrandGuideRecord>>,
): BrandGuideView => ({
  brandGuide: { id: record.slug, name: record.name, description: record.description },
  brandKit: toBrandKitView(record.brandKit?.assets ?? [], record.brandKit?.colors ?? []),
  presentationKit: toPresentationKitView(record.presentationKit),
});
