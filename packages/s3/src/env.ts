import { createEnvRegistry, requiredString } from "@onbrand/env";

export const Env = createEnvRegistry({
  AWS_REGION: requiredString("AWS_REGION", "us-east-1"),
});
