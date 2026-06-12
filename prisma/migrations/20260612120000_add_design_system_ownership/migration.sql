ALTER TABLE "DesignSystem" ADD COLUMN "ownerUserId" TEXT NOT NULL DEFAULT 'local-dev-user';
DROP INDEX IF EXISTS "DesignSystem_slug_key";
CREATE UNIQUE INDEX "DesignSystem_ownerUserId_slug_key" ON "DesignSystem"("ownerUserId", "slug");
CREATE INDEX "DesignSystem_ownerUserId_idx" ON "DesignSystem"("ownerUserId");
ALTER TABLE "DesignSystem" ALTER COLUMN "ownerUserId" DROP DEFAULT;
