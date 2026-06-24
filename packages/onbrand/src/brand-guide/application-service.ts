import type { BrandGuideOwner } from "./owner";
import type { BrandKitAssetMaterializationPlan } from "./brand-kit/asset-file/index";
import type { SupportedAssetMimeType } from "./brand-kit/asset-file/rules";
import type { BrandKitView } from "./brand-kit/index";
import type { BrandGuideSummary } from "./brand-guide";
import type { PresentationKitView } from "./presentation-kit/presentation-kit";

export { InvalidBrandGuideAssetUploadError } from "./brand-kit/asset-file/record";
export type { BrandGuideSummary } from "./brand-guide";
export type {
  BrandKitAssetDownload,
  BrandKitAssetMaterializationPlan,
  SupportedAssetMimeType,
} from "./brand-kit/asset-file/index";
export type { BrandKitDecorativeAsset } from "./brand-kit/decorative-assets/index";
export type { BrandKitView } from "./brand-kit/index";
export type { BrandKitVisualAsset } from "./brand-kit/logo/index";
export type { ColorToken } from "./brand-kit/color/index";
export type { PresentationKitView } from "./presentation-kit/presentation-kit";

export class UnknownBrandGuideError extends Error {
  constructor(readonly brandGuideId: string) {
    super(`Unknown Brand Guide: ${brandGuideId}`);
    this.name = "UnknownBrandGuideError";
  }
}

export class DuplicateBrandGuideNameError extends Error {
  constructor(readonly name: string) {
    super(`Duplicate Brand Guide name: ${name}`);
    this.name = "DuplicateBrandGuideNameError";
  }
}

export class DuplicateColorTokenNameError extends Error {
  constructor(readonly name: string) {
    super(`Duplicate Color Token name: ${name}`);
    this.name = "DuplicateColorTokenNameError";
  }
}

export class DuplicateDecorativeAssetNameError extends Error {
  constructor(readonly name: string) {
    super(`Duplicate Decorative Asset name: ${name}`);
    this.name = "DuplicateDecorativeAssetNameError";
  }
}

export class InvalidSourceUrlError extends Error {
  constructor(readonly sourceUrl: string) {
    super(`Invalid Source URL: ${sourceUrl}`);
    this.name = "InvalidSourceUrlError";
  }
}

export type BrandGuideView = Readonly<{
  brandGuide: BrandGuideSummary;
  brandKit: BrandKitView;
  presentationKit: PresentationKitView;
}>;

export type MaterializeBrandKitAssetsRequest = Readonly<{
  brandGuideId: string;
  outputDirectory: string;
}>;

export type GetBrandKitAssetPreviewUrlRequest = Readonly<{
  brandGuideId: string;
  assetHandle: string;
}>;

export type PrepareBrandGuideAssetUpload = Readonly<{
  assetId: string;
  filename: string;
  mimeType: SupportedAssetMimeType;
  byteSize: number;
  sha256: string;
}>;

export type PreparedBrandGuideAssetUpload = PrepareBrandGuideAssetUpload &
  Readonly<{
    s3Key: string;
    uploadUrl: string;
    expiresInSeconds: number;
    method: "PUT";
    headers: Readonly<{ "Content-Type": string }>;
    command: string;
  }>;

export type PrepareBrandGuideAssetUploadsRequest = Readonly<{
  brandGuideId: string;
  uploads: readonly PrepareBrandGuideAssetUpload[];
}>;

export type PrepareBrandGuideAssetUploadsResult = Readonly<{
  brandGuideId: string;
  instructions: string;
  uploads: readonly PreparedBrandGuideAssetUpload[];
}>;

export type WriteBrandGuideAsset = Readonly<{
  name: string;
  filename: string;
  mimeType: SupportedAssetMimeType;
  description: string;
  s3Key: string;
  byteSize: number;
  sha256: string;
}>;

export type WriteBrandGuideLogoAsset = WriteBrandGuideAsset & Readonly<{ assetId: string }>;

export type WriteBrandGuideMetadata = Readonly<{
  id: string;
  name: string;
  description: string | null;
}>;

export type WriteBrandGuideRequest = Readonly<{
  brandGuide: WriteBrandGuideMetadata;
  brandKit: Omit<BrandKitView, "logo" | "decorativeAssets"> &
    Readonly<{
      logo: WriteBrandGuideLogoAsset;
      decorativeAssets?: readonly (WriteBrandGuideAsset & Readonly<{ id: string }>)[];
    }>;
  presentationKit: PresentationKitView;
}>;

export type WriteBrandGuideResult = Readonly<{
  brandGuideId: string;
  action: "CREATED" | "UPDATED";
  brandGuide: BrandGuideView;
}>;

export type BrandGuideGenerationStatus = "PENDING" | "COMPLETED" | "FAILED";
export type BrandGuideGenerationRequest = Readonly<{
  id: string;
  sourceUrl: string;
  status: BrandGuideGenerationStatus;
  brandGuide: BrandGuideSummary;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateBrandGuideRequest = Readonly<{ name: string; description?: string | null }>;
export type CreateBrandGuideGenerationRequest = Readonly<{ sourceUrl: string }>;
export type UpdateBrandGuideMetadataRequest = Readonly<{
  brandGuideId: string;
  name?: string;
  description?: string | null;
}>;
export type UpsertColorTokenRequest = Readonly<{
  brandGuideId: string;
  previousName?: string;
  name: string;
  value: `#${string}`;
  description?: string | null;
}>;
export type DeleteColorTokenRequest = Readonly<{ brandGuideId: string; name: string }>;
export type UpsertLogoRequest = Readonly<{
  brandGuideId: string;
  asset: Omit<WriteBrandGuideLogoAsset, "assetId" | "name" | "description"> &
    Readonly<{ description?: string | null }>;
}>;
export type DeleteLogoRequest = Readonly<{ brandGuideId: string }>;
export type UpsertDecorativeAssetRequest = Readonly<{
  brandGuideId: string;
  previousName?: string;
  asset: Omit<WriteBrandGuideAsset, "description"> & Readonly<{ description?: string | null }>;
}>;
export type DeleteDecorativeAssetRequest = Readonly<{ brandGuideId: string; name: string }>;
export type UpdatePresentationKitRequest = Readonly<{
  brandGuideId: string;
  presentationKit: PresentationKitView;
}>;

export interface BrandGuideApplicationService {
  listBrandGuides(owner: BrandGuideOwner): Promise<readonly BrandGuideSummary[]>;
  getBrandGuide(owner: BrandGuideOwner, brandGuideId: string): Promise<BrandGuideView>;
  createBrandGuide(
    owner: BrandGuideOwner,
    request: CreateBrandGuideRequest,
  ): Promise<BrandGuideView>;
  createBrandGuideGenerationRequest(
    owner: BrandGuideOwner,
    request: CreateBrandGuideGenerationRequest,
  ): Promise<BrandGuideGenerationRequest>;
  updateBrandGuideMetadata(
    owner: BrandGuideOwner,
    request: UpdateBrandGuideMetadataRequest,
  ): Promise<BrandGuideView>;
  deleteBrandGuide(owner: BrandGuideOwner, brandGuideId: string): Promise<void>;
  upsertColorToken(
    owner: BrandGuideOwner,
    request: UpsertColorTokenRequest,
  ): Promise<BrandGuideView>;
  deleteColorToken(
    owner: BrandGuideOwner,
    request: DeleteColorTokenRequest,
  ): Promise<BrandGuideView>;
  upsertLogo(owner: BrandGuideOwner, request: UpsertLogoRequest): Promise<BrandGuideView>;
  deleteLogo(owner: BrandGuideOwner, request: DeleteLogoRequest): Promise<BrandGuideView>;
  upsertDecorativeAsset(
    owner: BrandGuideOwner,
    request: UpsertDecorativeAssetRequest,
  ): Promise<BrandGuideView>;
  deleteDecorativeAsset(
    owner: BrandGuideOwner,
    request: DeleteDecorativeAssetRequest,
  ): Promise<BrandGuideView>;
  updatePresentationKit(
    owner: BrandGuideOwner,
    request: UpdatePresentationKitRequest,
  ): Promise<BrandGuideView>;
  prepareBrandGuideAssetUploads(
    owner: BrandGuideOwner,
    request: PrepareBrandGuideAssetUploadsRequest,
  ): Promise<PrepareBrandGuideAssetUploadsResult>;
  materializeBrandKitAssets(
    owner: BrandGuideOwner,
    request: MaterializeBrandKitAssetsRequest,
  ): Promise<BrandKitAssetMaterializationPlan>;
  getBrandKitAssetPreviewUrl(
    owner: BrandGuideOwner,
    request: GetBrandKitAssetPreviewUrlRequest,
  ): Promise<string>;
  writeBrandGuide(
    owner: BrandGuideOwner,
    request: WriteBrandGuideRequest,
  ): Promise<WriteBrandGuideResult>;
}
