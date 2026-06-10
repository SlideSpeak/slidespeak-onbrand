import { z } from "zod";

export const integerSchema = z.number().int();
export const positiveIntegerSchema = integerSchema.positive();

export type Integer = z.infer<typeof integerSchema>;
export type PositiveInteger = z.infer<typeof positiveIntegerSchema>;
