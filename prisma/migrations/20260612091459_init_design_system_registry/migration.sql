-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BrandKitAssetKind" AS ENUM ('LOGO', 'DECORATIVE_ASSET');

-- CreateTable
CREATE TABLE "DesignSystem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandKit" (
    "id" TEXT NOT NULL,
    "designSystemId" TEXT NOT NULL,

    CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorToken" (
    "id" TEXT NOT NULL,
    "brandKitId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ColorToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandKitAsset" (
    "id" TEXT NOT NULL,
    "brandKitId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "kind" "BrandKitAssetKind" NOT NULL,
    "name" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "BrandKitAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresentationKit" (
    "id" TEXT NOT NULL,
    "designSystemId" TEXT NOT NULL,
    "canvasWidth" INTEGER NOT NULL,
    "canvasHeight" INTEGER NOT NULL,
    "canvasUnit" TEXT NOT NULL,
    "designPrompt" TEXT,

    CONSTRAINT "PresentationKit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignSystem_slug_key" ON "DesignSystem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BrandKit_designSystemId_key" ON "BrandKit"("designSystemId");

-- CreateIndex
CREATE INDEX "ColorToken_brandKitId_sortOrder_idx" ON "ColorToken"("brandKitId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ColorToken_brandKitId_tokenId_key" ON "ColorToken"("brandKitId", "tokenId");

-- CreateIndex
CREATE INDEX "BrandKitAsset_brandKitId_kind_idx" ON "BrandKitAsset"("brandKitId", "kind");

-- CreateIndex
CREATE INDEX "BrandKitAsset_brandKitId_sortOrder_idx" ON "BrandKitAsset"("brandKitId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "BrandKitAsset_brandKitId_assetId_key" ON "BrandKitAsset"("brandKitId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "PresentationKit_designSystemId_key" ON "PresentationKit"("designSystemId");

-- AddForeignKey
ALTER TABLE "BrandKit" ADD CONSTRAINT "BrandKit_designSystemId_fkey" FOREIGN KEY ("designSystemId") REFERENCES "DesignSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColorToken" ADD CONSTRAINT "ColorToken_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "BrandKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandKitAsset" ADD CONSTRAINT "BrandKitAsset_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "BrandKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationKit" ADD CONSTRAINT "PresentationKit_designSystemId_fkey" FOREIGN KEY ("designSystemId") REFERENCES "DesignSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

