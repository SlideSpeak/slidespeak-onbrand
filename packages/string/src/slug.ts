import { z } from "zod";

export const slugSchema = z.string().regex(/^[a-z][a-z0-9-]*$/);

export type Slug = z.infer<typeof slugSchema>;
