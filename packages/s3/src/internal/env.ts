export const requiredEnv = (env: NodeJS.ProcessEnv, name: string): string => {
  const value = env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};
