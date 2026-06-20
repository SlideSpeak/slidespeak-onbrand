import { DeleteObjectCommand, type S3Client } from "@aws-sdk/client-s3";

export type DeleteObjectInput = Readonly<{
  bucket: string;
  key: string;
}>;

export const deleteObject = async (
  client: S3Client,
  { bucket, key }: DeleteObjectInput,
): Promise<void> => {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};
