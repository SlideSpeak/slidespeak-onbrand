import { S3Client } from "@aws-sdk/client-s3";
import { Env } from "./env";
import { createPresignedGetUrl, type PresignedGetObjectInput } from "./get-presigned";
import { putObject, type PutObjectInput, type StoredObject } from "./put";

export const S3 = Object.freeze({
  put: (input: PutObjectInput): Promise<StoredObject> => putObject(clientFromEnv(), input),

  getPresigned: (input: PresignedGetObjectInput): Promise<string> =>
    createPresignedGetUrl(clientFromEnv(), input),
});

const clientFromEnv = (): S3Client => new S3Client({ region: Env.AWS_REGION });
