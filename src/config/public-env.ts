import { z } from "zod";

const publicOriginSchema = z
  .string()
  .url()
  .transform((value) => new URL(value))
  .refine(
    (url) =>
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "" &&
      url.username === "" &&
      url.password === "",
    "Expected an origin without a path, query, hash or credentials",
  )
  .transform((url) => url.origin);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: publicOriginSchema,
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_API_MOCKING: z.enum(["enabled", "disabled"]).default("disabled"),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
});
