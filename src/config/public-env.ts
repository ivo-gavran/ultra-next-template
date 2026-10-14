import { z } from "zod";

import { validatePublicUrl } from "./url-validation.ts";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .transform((value) => validatePublicUrl(value, "app")),
  NEXT_PUBLIC_API_URL: z
    .string()
    .transform((value) => validatePublicUrl(value, "api")),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
