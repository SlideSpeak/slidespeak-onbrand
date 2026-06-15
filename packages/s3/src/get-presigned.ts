import { GetObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { contentDisposition } from "./content-disposition";

export type PresignedGetObjectInput = Readonly<{
  bucket: string;
  key: string;
  filename: string;
  contentType: string;
  expiresInSeconds: number;
}>;

export const getPresigned = (
  client: S3Client,
  { bucket, key, filename, contentType, expiresInSeconds }: PresignedGetObjectInput,
): Promise<string> =>
  getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: contentDisposition(filename),
      ResponseContentType: contentType,
    }),
    { expiresIn: expiresInSeconds },
  );
