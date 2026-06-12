import { S3 } from "@onbrand/s3";
import { createPrismaClient } from "../../database/prisma-client";
import { StorageBuckets } from "../../storage/buckets";
import { brandKitAssetFileObjectKey } from "../brand-kit/storage/object-key";

const main = async (): Promise<void> => {
  const prisma = createPrismaClient();
  try {
    const assets = await prisma.brandKitAsset.findMany({
      where: { OR: [{ s3Key: null }, { byteSize: null }, { sha256: null }] },
      include: { brandKit: { include: { designSystem: true } } },
      orderBy: { id: "asc" },
    });

    for (const asset of assets) {
      if (!asset.bytes) {
        throw new Error(`Brand Kit asset ${asset.id} has no S3 metadata and no legacy bytes`);
      }

      const key = brandKitAssetFileObjectKey({
        ownerUserId: asset.brandKit.designSystem.ownerUserId,
        designSystemId: asset.brandKit.designSystem.slug,
        assetId: asset.assetId,
        filename: asset.filename,
      });
      const stored = await S3.put({
        bucket: StorageBuckets.brandKitAssets,
        key,
        bytes: asset.bytes,
        contentType: asset.mimeType,
        cacheControl: "private, max-age=31536000, immutable",
      });

      await prisma.brandKitAsset.update({
        where: { id: asset.id },
        data: {
          s3Key: stored.key,
          byteSize: stored.byteSize,
          sha256: stored.sha256,
        },
      });
      console.error(
        `Uploaded ${asset.brandKit.designSystem.slug}/${asset.assetId} -> ${stored.key}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
