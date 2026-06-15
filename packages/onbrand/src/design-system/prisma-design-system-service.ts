import { brandKitAssetFileObjectKey } from "./brand-kit/asset-file/object-key";
import type { S3 } from "@onbrand/s3";
import type { PrismaClient } from "@prisma/client";
import type { AuthContext } from "../auth/context";
import type { DesignSystemSummary } from "./design-system";
import type { BrandKitAssetMaterializationPlan } from "./brand-kit/asset-file/index";
import { toBrandKitAssetDownload } from "./brand-kit/asset-file/db";
import { toStoredDecorativeAssetRecord } from "./brand-kit/decorative-assets/db";
import { toStoredLogoAssetRecord } from "./brand-kit/logo/db";
import type {
  DesignSystemApplicationService,
  MaterializeBrandKitAssetsRequest,
  DesignSystemView,
  PrepareDesignSystemAssetUploadsRequest,
  PrepareDesignSystemAssetUploadsResult,
  WriteDesignSystemRequest,
  WriteDesignSystemResult,
} from "./application-service";
import {
  listDesignSystemSummaries,
  loadStoredDesignSystem,
  toDesignSystemView,
} from "./storage/prisma-design-system";

export class PrismaDesignSystemApplicationService implements DesignSystemApplicationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly s3: Pick<typeof S3, "getPresigned" | "putPresigned">,
    private readonly brandKitAssetBucket: string,
    private readonly assetPresignedUrlExpiresInSeconds: number,
  ) {}

  listDesignSystems = async (auth: AuthContext): Promise<readonly DesignSystemSummary[]> =>
    listDesignSystemSummaries(this.prisma, auth);

  getDesignSystem = async (auth: AuthContext, designSystemId: string): Promise<DesignSystemView> =>
    toDesignSystemView(await loadStoredDesignSystem(this.prisma, auth, designSystemId));

  materializeBrandKitAssets = async (
    auth: AuthContext,
    { designSystemId, outputDirectory }: MaterializeBrandKitAssetsRequest,
  ): Promise<BrandKitAssetMaterializationPlan> => {
    const stored = await loadStoredDesignSystem(this.prisma, auth, designSystemId);
    const normalizedOutputDirectory = normalizeOutputDirectory(outputDirectory);
    const downloads = await Promise.all(
      stored.brandKit!.assets.map((asset) =>
        toBrandKitAssetDownload({
          s3: this.s3,
          bucket: this.brandKitAssetBucket,
          expiresInSeconds: this.assetPresignedUrlExpiresInSeconds,
          outputDirectory: normalizedOutputDirectory,
          asset,
        }),
      ),
    );

    return {
      designSystemId,
      outputDirectory: normalizedOutputDirectory,
      expiresInSeconds: this.assetPresignedUrlExpiresInSeconds,
      instructions:
        "Run the commands in the user's workspace to download exact Brand Kit files from short-lived S3 URLs. Do not paste, decode, or rewrite asset bytes manually from the response.",
      commands: [
        `mkdir -p ${shellQuote(normalizedOutputDirectory)}`,
        ...downloads.map(
          (asset) =>
            `curl -fsSL ${shellQuote(asset.downloadUrl)} -o ${shellQuote(asset.targetPath)}`,
        ),
      ],
      assets: downloads,
    };
  };

  prepareDesignSystemAssetUploads = async (
    auth: AuthContext,
    request: PrepareDesignSystemAssetUploadsRequest,
  ): Promise<PrepareDesignSystemAssetUploadsResult> => {
    const uploads = await Promise.all(
      request.uploads.map(async (upload) => {
        const s3Key = brandKitAssetFileObjectKey({
          ownerUserId: auth.ownerUserId,
          designSystemId: request.designSystemId,
          assetId: upload.assetId,
          filename: upload.filename,
        });
        const uploadUrl = await this.s3.putPresigned({
          bucket: this.brandKitAssetBucket,
          key: s3Key,
          contentType: upload.mimeType,
          checksumSha256Base64: hexToBase64Sha256(upload.sha256),
          expiresInSeconds: this.assetPresignedUrlExpiresInSeconds,
        });
        return {
          ...upload,
          s3Key,
          uploadUrl,
          expiresInSeconds: this.assetPresignedUrlExpiresInSeconds,
          method: "PUT" as const,
          headers: { "Content-Type": upload.mimeType },
          command: `curl -fsSL -X PUT -H ${shellQuote(`Content-Type: ${upload.mimeType}`)} --upload-file ${shellQuote(upload.filename)} ${shellQuote(uploadUrl)}`,
        };
      }),
    );

    return {
      designSystemId: request.designSystemId,
      instructions:
        "Run each PUT command from the directory containing the exact asset file. Then submit the Design System with the returned s3Key, byteSize, and sha256 metadata. Do not send asset bytes through the application API.",
      uploads,
    };
  };

  writeDesignSystem = async (
    auth: AuthContext,
    request: WriteDesignSystemRequest,
  ): Promise<WriteDesignSystemResult> => {
    const storedAssets = [
      toStoredLogoAssetRecord({
        ownerUserId: auth.ownerUserId,
        designSystemId: request.designSystem.id,
        asset: request.brandKit.logo,
      }),
      ...(request.brandKit.decorativeAssets ?? []).map((asset, index) =>
        toStoredDecorativeAssetRecord({
          ownerUserId: auth.ownerUserId,
          designSystemId: request.designSystem.id,
          asset,
          sortOrder: index + 1,
        }),
      ),
    ];

    const action = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.designSystem.findUnique({
        where: {
          ownerUserId_slug: { ownerUserId: auth.ownerUserId, slug: request.designSystem.id },
        },
        select: { id: true },
      });
      const designSystem = await tx.designSystem.upsert({
        where: {
          ownerUserId_slug: { ownerUserId: auth.ownerUserId, slug: request.designSystem.id },
        },
        create: {
          ownerUserId: auth.ownerUserId,
          slug: request.designSystem.id,
          schemaVersion: 1,
          name: request.designSystem.name,
          description: request.designSystem.description,
        },
        update: { name: request.designSystem.name, description: request.designSystem.description },
      });
      await tx.brandKit.deleteMany({ where: { designSystemId: designSystem.id } });
      await tx.presentationKit.deleteMany({ where: { designSystemId: designSystem.id } });
      await tx.brandKit.create({
        data: {
          designSystemId: designSystem.id,
          colors: {
            create: request.brandKit.colors.map((color, index) => ({
              tokenId: color.id,
              name: color.name,
              value: color.value,
              description: color.description,
              sortOrder: index,
            })),
          },
          assets: { create: storedAssets },
        },
      });
      await tx.presentationKit.create({
        data: {
          designSystemId: designSystem.id,
          canvasWidth: request.presentationKit.canvas.width,
          canvasHeight: request.presentationKit.canvas.height,
          canvasUnit: request.presentationKit.canvas.unit,
          designPrompt: request.presentationKit.designPrompt,
        },
      });
      return existing ? "updated" : "created";
    });

    return {
      designSystemId: request.designSystem.id,
      action,
      designSystem: await this.getDesignSystem(auth, request.designSystem.id),
    };
  };
}

const hexToBase64Sha256 = (hex: string): string => Buffer.from(hex, "hex").toString("base64");

const normalizeOutputDirectory = (outputDirectory: string): string => {
  const normalized = outputDirectory
    .trim()
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "");
  return normalized.length === 0 ? "." : normalized;
};

const shellQuote = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;
