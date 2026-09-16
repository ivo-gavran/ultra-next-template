"use client";

import { z } from "zod";

import type { SignUpInput } from "@/features/auth/schemas";
import { apiRequest } from "@/lib/api/client";

const registerResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().email().nullable(),
  }),
});

export function registerAccount(input: SignUpInput) {
  return apiRequest("/api/register", {
    method: "POST",
    body: input,
    schema: registerResponseSchema,
  });
}
