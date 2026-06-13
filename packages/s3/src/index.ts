import { S3Client } from "@aws-sdk/client-s3";
import { Env } from "./env";
import { createPresignedGetUrl, type PresignedGetObjectInput } from "./get-presigned";
import { putObject, type PutObjectInput, type StoredObject } from "./put";

type S3Config = Readonly<{
  env?: NodeJS.ProcessEnv;
}>;

export const S3 = Object.freeze({
  put: (input: PutObjectInput, config?: S3Config): Promise<StoredObject> =>
    putObject(clientFromEnv(config?.env ?? process.env), input),

  getPresigned: (input: PresignedGetObjectInput, config?: S3Config): Promise<string> =>
    createPresignedGetUrl(clientFromEnv(config?.env ?? process.env), input),
});

const clientFromEnv = (env: NodeJS.ProcessEnv): S3Client => {
  const region = env === process.env ? Env.AWS_REGION : (env.AWS_REGION ?? "us-east-1");
  return new S3Client({ region });
};
