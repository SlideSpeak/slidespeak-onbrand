-- Rename the top-level governed design object from DesignSystem to BrandGuide.
ALTER TABLE "DesignSystem" RENAME TO "BrandGuide";

ALTER TABLE "BrandKit" RENAME COLUMN "designSystemId" TO "brandGuideId";
ALTER TABLE "PresentationKit" RENAME COLUMN "designSystemId" TO "brandGuideId";

ALTER INDEX IF EXISTS "DesignSystem_pkey" RENAME TO "BrandGuide_pkey";
ALTER INDEX IF EXISTS "DesignSystem_ownerUserId_slug_key" RENAME TO "BrandGuide_ownerUserId_slug_key";
ALTER INDEX IF EXISTS "DesignSystem_ownerUserId_idx" RENAME TO "BrandGuide_ownerUserId_idx";
ALTER INDEX IF EXISTS "BrandKit_designSystemId_key" RENAME TO "BrandKit_brandGuideId_key";
ALTER INDEX IF EXISTS "PresentationKit_designSystemId_key" RENAME TO "PresentationKit_brandGuideId_key";

ALTER TABLE "BrandKit" RENAME CONSTRAINT "BrandKit_designSystemId_fkey" TO "BrandKit_brandGuideId_fkey";
ALTER TABLE "PresentationKit" RENAME CONSTRAINT "PresentationKit_designSystemId_fkey" TO "PresentationKit_brandGuideId_fkey";
