import { S3Client } from "@aws-sdk/client-s3";
import { Env } from "./env";
import { deleteObject, type DeleteObjectInput } from "./delete-object";
import { getPresigned, type PresignedGetObjectInput } from "./get-presigned";
import { putObject, type PutObjectInput } from "./put-object";
import { putPresigned, type PresignedPutObjectInput } from "./put-presigned";

const client = new S3Client({ region: Env.AWS_REGION });

export const S3 = Object.freeze({
  getPresigned: (input: PresignedGetObjectInput): Promise<string> => getPresigned(client, input),

  putPresigned: (input: PresignedPutObjectInput): Promise<string> => putPresigned(client, input),

  putObject: (input: PutObjectInput): Promise<void> => putObject(client, input),

  deleteObject: (input: DeleteObjectInput): Promise<void> => deleteObject(client, input),
});
