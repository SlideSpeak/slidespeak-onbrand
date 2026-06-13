ALTER TABLE "BrandKitAsset"
  ADD COLUMN "s3Key" TEXT,
  ADD COLUMN "byteSize" INTEGER,
  ADD COLUMN "sha256" TEXT,
  ALTER COLUMN "bytes" DROP NOT NULL;

CREATE INDEX "BrandKitAsset_s3Key_idx" ON "BrandKitAsset"("s3Key");
