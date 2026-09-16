import { describe, expect, it } from "vitest";

import { AppError, ErrorCode } from "@/lib/errors/app-error";
import { getErrorMessageKey } from "@/lib/errors/messages";

describe("getErrorMessageKey", () => {
  it("maps application error codes to stable translation keys", () => {
    const error = new AppError({ code: ErrorCode.EmailTaken });

    expect(getErrorMessageKey(error)).toBe("emailTaken");
  });

  it("uses the generic message for unknown errors", () => {
    expect(getErrorMessageKey(new Error("Database unavailable"))).toBe(
      "unexpected",
    );
  });
});
