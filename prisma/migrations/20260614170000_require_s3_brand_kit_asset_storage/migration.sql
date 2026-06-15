-- Brand Kit assets are now stored exclusively in S3. This migration intentionally fails if any
-- pre-S3 rows were not backfilled before deployment because S3 metadata is now mandatory.
ALTER TABLE "BrandKitAsset"
  ALTER COLUMN "s3Key" SET NOT NULL,
  ALTER COLUMN "byteSize" SET NOT NULL,
  ALTER COLUMN "sha256" SET NOT NULL,
  DROP COLUMN "bytes";
