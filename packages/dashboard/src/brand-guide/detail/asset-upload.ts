import type { PreparedBrandGuideAssetUpload } from "@onbrand/core/brand-guide/application-service";
import { sendJson } from "../../shared/api/api-state";

const ACCEPTED_TYPES = ["image/svg+xml", "image/png", "image/jpeg", "image/webp"] as const;
const MAX_BYTES = 10 * 1024 * 1024;

export const uploadBrandGuideAsset = async (
  brandGuideId: string,
  assetId: string,
  file: File,
): Promise<PreparedBrandGuideAssetUpload> => {
  if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number]))
    throw new Error("Upload SVG, PNG, JPEG, or WebP assets only.");
  if (file.size > MAX_BYTES) throw new Error("Asset files must be 10 MB or smaller.");

  const sha256 = await fileSha256(file);
  const prepared = await sendJson<{ uploads: readonly PreparedBrandGuideAssetUpload[] }>(
    `/api/brand-guides/${encodeURIComponent(brandGuideId)}/asset-uploads`,
    {
      method: "POST",
      body: {
        uploads: [
          { assetId, filename: file.name, mimeType: file.type, byteSize: file.size, sha256 },
        ],
      },
    },
  );
  const upload = prepared.uploads[0];
  if (!upload) throw new Error("Asset upload could not be prepared.");
  const response = await fetch(upload.uploadUrl, {
    method: upload.method,
    headers: upload.headers,
    body: file,
  });
  if (!response.ok) throw new Error("Asset upload failed.");
  return upload;
};

const fileSha256 = async (file: File): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};
