const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const StorageBuckets = Object.freeze({
  brandKitAssets: requiredEnv("AWS_S3_BUCKET_BRAND_KIT_ASSETS"),
});
