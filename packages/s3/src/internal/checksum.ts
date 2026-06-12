import { createHash } from "node:crypto";

export const hexSha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

export const base64Sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("base64");
