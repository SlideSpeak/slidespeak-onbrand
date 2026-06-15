import { S3Client } from "@aws-sdk/client-s3";
import { Env } from "./env";
import { getPresigned, type PresignedGetObjectInput } from "./get-presigned";
import { putPresigned, type PresignedPutObjectInput } from "./put-presigned";

const client = new S3Client({ region: Env.AWS_REGION });

export const S3 = Object.freeze({
  getPresigned: (input: PresignedGetObjectInput): Promise<string> => getPresigned(client, input),

  putPresigned: (input: PresignedPutObjectInput): Promise<string> => putPresigned(client, input),
});
