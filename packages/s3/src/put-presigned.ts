import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type PresignedPutObjectInput = Readonly<{
  bucket: string;
  key: string;
  contentType: string;
  checksumSha256Base64: string;
  expiresInSeconds: number;
}>;

export const putPresigned = (
  client: S3Client,
  { bucket, key, contentType, checksumSha256Base64, expiresInSeconds }: PresignedPutObjectInput,
): Promise<string> =>
  getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ChecksumSHA256: checksumSha256Base64,
    }),
    { expiresIn: expiresInSeconds },
  );
