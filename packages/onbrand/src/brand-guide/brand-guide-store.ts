import type { BrandGuide as DbBrandGuide, PrismaClient } from "@prisma/client";
import {
  UnknownBrandGuideError,
  type BrandGuideView,
  type WriteBrandGuideRequest,
} from "./application-service";
import { BRAND_KIT_INCLUDE, toBrandKitView } from "./brand-kit/record";
import { toBrandKitAssetFileRecord, type BrandKitAssetRecord } from "./brand-kit/asset-file/record";
import { toColorTokenCreateRecords } from "./brand-kit/color/record";
import type { BrandGuideOwner } from "./owner";
import { toPresentationKitCreateRecord, toPresentationKitView } from "./presentation-kit/record";
import type { BrandGuideSummary } from "./brand-guide";

type BrandGuideSummaryRecord = Readonly<Pick<DbBrandGuide, "slug" | "name" | "description">>;

export type BrandGuideRegistryWriteResult = Readonly<{
  brandGuideId: string;
  action: "CREATED" | "UPDATED";
  brandGuide: BrandGuideView;
}>;

export interface BrandGuideRegistry {
  list(owner: BrandGuideOwner): Promise<readonly BrandGuideSummary[]>;
  load(owner: BrandGuideOwner, brandGuideId: string): Promise<BrandGuideView>;
  loadBrandKitAssets(
    owner: BrandGuideOwner,
    brandGuideId: string,
  ): Promise<readonly BrandKitAssetRecord[]>;
  replace(
    owner: BrandGuideOwner,
    request: WriteBrandGuideRequest,
  ): Promise<BrandGuideRegistryWriteResult>;
}

export class PrismaBrandGuideRegistry implements BrandGuideRegistry {
  constructor(private readonly prisma: PrismaClient) {}

  list = async (owner: BrandGuideOwner): Promise<readonly BrandGuideSummary[]> => {
    const rows: readonly BrandGuideSummaryRecord[] = await this.prisma.brandGuide.findMany({
      where: { ownerUserId: owner.ownerUserId },
      orderBy: { id: "asc" },
      select: { slug: true, name: true, description: true },
    });
    return rows.map((row) => ({ id: row.slug, name: row.name, description: row.description }));
  };

  load = async (owner: BrandGuideOwner, brandGuideId: string): Promise<BrandGuideView> =>
    toBrandGuideView(await loadBrandGuideRecord(this.prisma, owner, brandGuideId));

  loadBrandKitAssets = async (
    owner: BrandGuideOwner,
    brandGuideId: string,
  ): Promise<readonly BrandKitAssetRecord[]> => {
    const record = await loadBrandGuideRecord(this.prisma, owner, brandGuideId);
    return record.brandKit!.assets;
  };

  replace = async (
    owner: BrandGuideOwner,
    request: WriteBrandGuideRequest,
  ): Promise<BrandGuideRegistryWriteResult> => {
    const assetRecords = [
      toBrandKitAssetFileRecord({
        kind: "LOGO",
        ownerUserId: owner.ownerUserId,
        brandGuideId: request.brandGuide.id,
        asset: request.brandKit.logo,
      }),
      ...(request.brandKit.decorativeAssets ?? []).map((asset, index) =>
        toBrandKitAssetFileRecord({
          kind: "DECORATIVE_ASSET",
          ownerUserId: owner.ownerUserId,
          brandGuideId: request.brandGuide.id,
          asset,
          sortOrder: index + 1,
        }),
      ),
    ];

    const action = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.brandGuide.findUnique({
        where: {
          ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: request.brandGuide.id },
        },
        select: { id: true },
      });
      const brandGuide = await tx.brandGuide.upsert({
        where: {
          ownerUserId_slug: { ownerUserId: owner.ownerUserId, slug: request.brandGuide.id },
        },
        create: {
          ownerUserId: owner.ownerUserId,
          slug: request.brandGuide.id,
          schemaVersion: 1,
          name: request.brandGuide.name,
          description: request.brandGuide.description,
        },
        update: { name: request.brandGuide.name, description: request.brandGuide.description },
      });
      await tx.brandKit.deleteMany({ where: { brandGuideId: brandGuide.id } });
      await tx.presentationKit.deleteMany({ where: { brandGuideId: brandGuide.id } });
      await tx.brandKit.create({
        data: {
          brandGuideId: brandGuide.id,
          colors: { create: toColorTokenCreateRecords(request.brandKit.colors) },
          assets: { create: assetRecords },
        },
      });
      await tx.presentationKit.create({
        data: toPresentationKitCreateRecord(brandGuide.id, request.presentationKit),
      });
      return existing ? "UPDATED" : "CREATED";
    });

    return {
      brandGuideId: request.brandGuide.id,
      action,
      brandGuide: await this.load(owner, request.brandGuide.id),
    };
  };
}

const loadBrandGuideRecord = async (
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
  if (!row || !row.brandKit || !row.presentationKit) {
    throw new UnknownBrandGuideError(brandGuideId);
  }
  return row;
};

const toBrandGuideView = (
  record: Awaited<ReturnType<typeof loadBrandGuideRecord>>,
): BrandGuideView => ({
  brandGuide: { id: record.slug, name: record.name, description: record.description },
  brandKit: toBrandKitView(record.brandKit!.assets, record.brandKit!.colors),
  presentationKit: toPresentationKitView(record.presentationKit!),
});
