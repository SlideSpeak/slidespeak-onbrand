import path from "node:path";
import type { S3 } from "@onbrand/s3";
import { brandKitAssetFileObjectKey } from "./object-key";
import type { BrandKitAssetDownload, BrandKitAssetMaterializationPlan } from "./index";
import { decorativeAssetHandle } from "../decorative-assets/index";
import { LOGO_ASSET_HANDLE } from "../logo/index";
import { asSupportedBrandKitAssetMimeType, type BrandKitAssetRecord } from "./record";

export type PrepareBrandKitAssetUpload = Readonly<{
  assetId: string;
  filename: string;
  mimeType: "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp";
  byteSize: number;
  sha256: string;
}>;

export type PreparedBrandKitAssetUpload = PrepareBrandKitAssetUpload &
  Readonly<{
    s3Key: string;
    uploadUrl: string;
    expiresInSeconds: number;
    method: "PUT";
    headers: Readonly<{ "Content-Type": string }>;
    command: string;
  }>;

export type PrepareBrandKitAssetUploadsResult = Readonly<{
  designSystemId: string;
  instructions: string;
  uploads: readonly PreparedBrandKitAssetUpload[];
}>;

export class BrandKitAssetFileWorkflow {
  constructor(
    private readonly s3: Pick<typeof S3, "getPresigned" | "putPresigned">,
    private readonly bucket: string,
    private readonly presignedUrlExpiresInSeconds: number,
  ) {}

  materialize = async ({
    designSystemId,
    outputDirectory,
    assets,
  }: {
    designSystemId: string;
    outputDirectory: string;
    assets: readonly BrandKitAssetRecord[];
  }): Promise<BrandKitAssetMaterializationPlan> => {
    const normalizedOutputDirectory = normalizeOutputDirectory(outputDirectory);
    const downloads = await Promise.all(
      assets.map((asset) => this.toDownload({ outputDirectory: normalizedOutputDirectory, asset })),
    );

    return {
      designSystemId,
      outputDirectory: normalizedOutputDirectory,
      expiresInSeconds: this.presignedUrlExpiresInSeconds,
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

  prepareUploads = async ({
    ownerUserId,
    designSystemId,
    uploads,
  }: {
    ownerUserId: string;
    designSystemId: string;
    uploads: readonly PrepareBrandKitAssetUpload[];
  }): Promise<PrepareBrandKitAssetUploadsResult> => {
    const preparedUploads = await Promise.all(
      uploads.map(async (upload) => {
        const s3Key = brandKitAssetFileObjectKey({
          ownerUserId,
          designSystemId,
          assetId: upload.assetId,
          filename: upload.filename,
        });
        const uploadUrl = await this.s3.putPresigned({
          bucket: this.bucket,
          key: s3Key,
          contentType: upload.mimeType,
          checksumSha256Base64: hexToBase64Sha256(upload.sha256),
          expiresInSeconds: this.presignedUrlExpiresInSeconds,
        });
        return {
          ...upload,
          s3Key,
          uploadUrl,
          expiresInSeconds: this.presignedUrlExpiresInSeconds,
          method: "PUT" as const,
          headers: { "Content-Type": upload.mimeType },
          command: `curl -fsSL -X PUT -H ${shellQuote(`Content-Type: ${upload.mimeType}`)} --upload-file ${shellQuote(upload.filename)} ${shellQuote(uploadUrl)}`,
        };
      }),
    );

    return {
      designSystemId,
      instructions:
        "Run each PUT command from the directory containing the exact asset file. Then submit the Design System with the returned s3Key, byteSize, and sha256 metadata. Do not send asset bytes through the application API.",
      uploads: preparedUploads,
    };
  };

  private toDownload = async ({
    outputDirectory,
    asset,
  }: {
    outputDirectory: string;
    asset: BrandKitAssetRecord;
  }): Promise<BrandKitAssetDownload> => {
    const targetPath = joinOutputPath(outputDirectory, asset.filename);
    const common = {
      assetHandle: brandKitAssetHandle(asset),
      name: asset.name,
      filename: asset.filename,
      mimeType: asSupportedBrandKitAssetMimeType(asset.mimeType),
      downloadUrl: await this.s3.getPresigned({
        bucket: this.bucket,
        key: asset.s3Key,
        filename: asset.filename,
        contentType: asset.mimeType,
        expiresInSeconds: this.presignedUrlExpiresInSeconds,
      }),
      targetPath,
      ...(path.posix.isAbsolute(outputDirectory) ? {} : { relativePath: targetPath }),
    } as const;

    return asset.kind === "LOGO"
      ? { ...common, kind: "LOGO" }
      : { ...common, kind: "DECORATIVE_ASSET", id: asset.assetId };
  };
}

export const normalizeOutputDirectory = (outputDirectory: string): string => {
  const normalized = outputDirectory
    .trim()
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "");

  if (normalized.startsWith("/")) {
    throw new Error("Brand Kit asset outputDirectory must be relative to the workspace");
  }
  if (normalized.split("/").includes("..")) {
    throw new Error("Brand Kit asset outputDirectory must not contain '..' path segments");
  }

  return normalized.length === 0 ? "." : normalized;
};

const hexToBase64Sha256 = (hex: string): string => Buffer.from(hex, "hex").toString("base64");

const shellQuote = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;

const brandKitAssetHandle = (asset: BrandKitAssetRecord): string =>
  asset.kind === "LOGO" ? LOGO_ASSET_HANDLE : decorativeAssetHandle(asset.assetId);

const joinOutputPath = (outputDirectory: string, filename: string): string =>
  outputDirectory === "." ? filename : path.posix.join(outputDirectory, filename);
