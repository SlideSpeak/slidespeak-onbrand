import { z } from "zod";

export const logoSchema = z
  .object({
    name: z.string().min(1),
    source: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();

export type Logo = Readonly<z.infer<typeof logoSchema>>;
