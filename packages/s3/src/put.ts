import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { base64Sha256, hexSha256 } from "./internal/checksum";

export type StoredObject = Readonly<{
  key: string;
  bucket: string;
  byteSize: number;
  sha256: string;
}>;

export type PutObjectInput = Readonly<{
  bucket: string;
  key: string;
  bytes: Uint8Array;
  contentType: string;
  cacheControl?: string;
}>;

export const putObject = async (
  client: S3Client,
  { bucket, key, bytes, contentType, cacheControl }: PutObjectInput,
): Promise<StoredObject> => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      CacheControl: cacheControl,
      ChecksumSHA256: base64Sha256(bytes),
    }),
  );

  return {
    key,
    bucket,
    byteSize: bytes.byteLength,
    sha256: hexSha256(bytes),
  };
};
