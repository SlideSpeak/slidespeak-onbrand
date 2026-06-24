import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";

export type PutObjectInput = Readonly<{
  bucket: string;
  key: string;
  body: Uint8Array;
  contentType: string;
  checksumSha256Base64: string;
}>;

export const putObject = async (
  client: S3Client,
  { bucket, key, body, contentType, checksumSha256Base64 }: PutObjectInput,
): Promise<void> => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ChecksumSHA256: checksumSha256Base64,
    }),
  );
};
