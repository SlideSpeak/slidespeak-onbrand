import { createHash } from "node:crypto";
import { extractBrandAssets, type BackdropAsset, type ColorAsset, type LogoAsset } from "openbrand";

import type { SupportedAssetMimeType } from "./brand-kit/asset-file/rules";
import type { ColorToken } from "./brand-kit/color/index";
import { colorTokenIdFromName, decorativeAssetIdFromName } from "./management-identifiers";
import {
  assertPublicOutboundUrl,
  fetchPublicOutboundUrl,
  normalizePublicHttpUrl,
  OUTBOUND_REQUEST_TIMEOUT_MS,
  withPublicOutboundFetch,
} from "./source-url-security";
import { titleCase } from "./text";

export type ExtractedBrandGuideSource = Readonly<{
  brandName: string | null;
  colors: readonly ColorToken[];
  logo: ExtractedBrandKitAsset | null;
  decorativeAssets: readonly ExtractedBrandKitAsset[];
}>;

export type ExtractedBrandKitAsset = Readonly<{
  assetId: string;
  name: string;
  filename: string;
  mimeType: SupportedAssetMimeType;
  description: string;
  sourceUrl?: string;
  bytes: Uint8Array;
  byteSize: number;
  sha256: string;
}>;

type AssetCandidate = Readonly<{
  url: string;
  role: "LOGO" | "DECORATIVE_ASSET";
  name: string;
  description: string;
}>;

const MAX_ASSET_BYTES = 5_000_000;
const MAX_COLORS = 8;
const MAX_DECORATIVE_ASSETS = 2;
const USER_AGENT = "Mozilla/5.0 (compatible; Onbrand/1.0; +https://slidespeak.co/onbrand)";

export const extractBrandGuideSource = async (
  sourceUrl: string,
): Promise<ExtractedBrandGuideSource> => {
  const url = normalizePublicHttpUrl(sourceUrl);
  if (!url) throw new Error(`Invalid Source URL: ${sourceUrl}`);
  await assertPublicOutboundUrl(url);
  const extraction = await withTimeout(
    withPublicOutboundFetch(() => extractBrandAssets(url.toString())),
    OUTBOUND_REQUEST_TIMEOUT_MS,
  );
  if (!extraction.ok) {
    throw new Error(`Could not extract Source URL: ${extraction.error.message}`);
  }

  const logo = await firstDownloadedAsset(
    extraction.data.logos.map((asset) => logoCandidate(asset)),
  );
  const decorativeAssets = await downloadedAssets(
    extraction.data.backdrop_images
      .filter((asset) => asset.url !== logo?.sourceUrl)
      .map((asset) => decorativeAssetCandidate(asset)),
    MAX_DECORATIVE_ASSETS,
  );

  return {
    brandName: normalizeBrandName(extraction.data.brand_name),
    colors: extraction.data.colors
      .map((color) => ({ value: normalizeHex(color.hex), usage: color.usage }))
      .filter(
        (color): color is Readonly<{ value: `#${string}`; usage: ColorAsset["usage"] }> =>
          color.value !== null,
      )
      .filter(uniqueColorValue)
      .slice(0, MAX_COLORS)
      .map(toColorToken),
    logo,
    decorativeAssets,
  };
};

const logoCandidate = (asset: LogoAsset): AssetCandidate => ({
  url: asset.url,
  role: "LOGO",
  name: "Logo",
  description: `Exact logo candidate extracted from ${asset.url}.`,
});

const decorativeAssetCandidate = (asset: BackdropAsset): AssetCandidate => ({
  url: asset.url,
  role: "DECORATIVE_ASSET",
  name: assetNameFromUrl(asset.url),
  description: asset.description
    ? `${asset.description} extracted from ${asset.url}.`
    : `Decorative visual extracted from ${asset.url}.`,
});

const toColorToken = (
  color: Readonly<{ value: `#${string}`; usage: ColorAsset["usage"] }>,
  index: number,
  colors: readonly Readonly<{ value: `#${string}`; usage: ColorAsset["usage"] }>[],
): ColorToken => {
  const name = colorTokenName(color, index, colors);
  return {
    id: colorTokenIdFromName(name),
    name,
    value: color.value,
    description: `${name} extracted from the Source URL visual system.`,
  };
};

const colorTokenName = (
  color: Readonly<{ value: `#${string}`; usage: ColorAsset["usage"] }>,
  index: number,
  colors: readonly Readonly<{ value: `#${string}`; usage: ColorAsset["usage"] }>[],
): string => {
  const baseName = colorUsageName(color.usage) ?? colorNameFromHex(color.value);
  const duplicateCount = colors
    .slice(0, index)
    .filter(
      (candidate) =>
        (colorUsageName(candidate.usage) ?? colorNameFromHex(candidate.value)) === baseName,
    ).length;
  return duplicateCount === 0 ? baseName : `${baseName} ${duplicateCount + 1}`;
};

const colorUsageName = (usage: ColorAsset["usage"]): string | null => {
  if (!usage) return null;
  return titleCase(usage.replace(/[-_]+/gu, " "));
};

const colorNameFromHex = (value: `#${string}`): string => `Color ${value.slice(1).toUpperCase()}`;

const firstDownloadedAsset = async (
  candidates: readonly AssetCandidate[],
): Promise<ExtractedBrandKitAsset | null> => (await downloadedAssets(candidates, 1))[0] ?? null;

const downloadedAssets = async (
  candidates: readonly AssetCandidate[],
  limit: number,
): Promise<readonly ExtractedBrandKitAsset[]> => {
  const assets: ExtractedBrandKitAsset[] = [];
  for (const candidate of candidates) {
    const asset = await downloadAsset(candidate).catch(() => null);
    if (!asset) continue;
    assets.push(asset);
    if (assets.length >= limit) break;
  }
  return assets;
};

const downloadAsset = async (candidate: AssetCandidate): Promise<ExtractedBrandKitAsset | null> => {
  const response = await fetchPublicUrl(candidate.url);
  if (!response.ok) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_ASSET_BYTES) return null;
  const mimeType = supportedMimeType(response.headers.get("content-type"), candidate.url);
  if (!mimeType) return null;
  const filename = filenameFromUrl(candidate.url, mimeType, candidate.role);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return {
    assetId: candidate.role === "LOGO" ? "logo" : decorativeAssetIdFromName(candidate.name),
    name: candidate.name,
    filename,
    mimeType,
    description: candidate.description,
    sourceUrl: candidate.url,
    bytes,
    byteSize: bytes.byteLength,
    sha256,
  };
};

const supportedMimeType = (
  contentType: string | null,
  url: string,
): SupportedAssetMimeType | null => {
  const mime = contentType?.split(";")[0]?.trim().toLowerCase();
  if (
    mime === "image/svg+xml" ||
    mime === "image/png" ||
    mime === "image/jpeg" ||
    mime === "image/webp"
  )
    return mime;
  const pathname = safePathname(url);
  if (/\.svg$/iu.test(pathname)) return "image/svg+xml";
  if (/\.png$/iu.test(pathname)) return "image/png";
  if (/\.jpe?g$/iu.test(pathname)) return "image/jpeg";
  if (/\.webp$/iu.test(pathname)) return "image/webp";
  return null;
};

const filenameFromUrl = (
  url: string,
  mimeType: SupportedAssetMimeType,
  role: AssetCandidate["role"],
): string => {
  const raw = safePathname(url).split("/").filter(Boolean).at(-1);
  if (raw && /\.[a-z0-9]+$/iu.test(raw)) return sanitizeFilename(raw);
  const extension =
    mimeType === "image/svg+xml"
      ? "svg"
      : mimeType === "image/jpeg"
        ? "jpg"
        : mimeType.replace("image/", "");
  return `${role === "LOGO" ? "logo" : "source-visual"}.${extension}`;
};

const assetNameFromUrl = (url: string): string => {
  const raw = safePathname(url).split("/").filter(Boolean).at(-1) ?? "Source Visual";
  const label = raw
    .replace(/\.[a-z0-9]+$/iu, "")
    .replace(/[-_]+/gu, " ")
    .trim();
  return titleCase(label || "Source Visual");
};

const normalizeHex = (raw: string): `#${string}` | null => {
  const color = raw.trim();
  if (!/^#[0-9a-f]{3,8}$/iu.test(color)) return null;
  const hex = color.slice(1);
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((character) => character + character)
      .join("")
      .toUpperCase()}`;
  }
  if (hex.length === 6 || hex.length === 8) return `#${hex.slice(0, 6).toUpperCase()}`;
  return null;
};

const normalizeBrandName = (value: string | null | undefined): string | null => {
  const normalized = value?.replace(/\s+/gu, " ").trim();
  return normalized ? normalized : null;
};

const safePathname = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

const uniqueColorValue = (
  color: Readonly<{ value: `#${string}` }>,
  index: number,
  colors: readonly Readonly<{ value: `#${string}` }>[],
): boolean => colors.findIndex((candidate) => candidate.value === color.value) === index;

const sanitizeFilename = (value: string): string => value.replace(/[^a-z0-9._-]/giu, "-");

const fetchPublicUrl = async (rawUrl: string, redirects = 0): Promise<Response> => {
  if (redirects > 5) throw new Error(`Too many redirects while fetching ${rawUrl}`);
  const url = normalizePublicHttpUrl(rawUrl);
  if (!url) throw new Error(`Invalid asset URL: ${rawUrl}`);
  await assertPublicOutboundUrl(url);
  const response = await fetchPublicOutboundUrl(url, {
    headers: {
      Accept: "image/svg+xml,image/png,image/jpeg,image/webp",
      "User-Agent": USER_AGENT,
    },
    redirect: "manual",
    signal: AbortSignal.timeout(OUTBOUND_REQUEST_TIMEOUT_MS),
  });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) return response;
    return fetchPublicUrl(new URL(location, url).toString(), redirects + 1);
  }
  return response;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => reject(new Error("Outbound request timed out")), timeoutMs);
    promise.finally(() => clearTimeout(timeoutId)).catch(() => clearTimeout(timeoutId));
  });
  return Promise.race([promise, timeout]);
};
