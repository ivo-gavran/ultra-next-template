import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import enMessages from "../../../messages/en.json";

import LocaleError from "@/app/[locale]/error";
import { reportAppError } from "@/lib/errors/reporting";

vi.mock("@/lib/errors/reporting", () => ({
  reportAppError: vi.fn(),
}));

describe("LocaleError", () => {
  it("reports the error and retries the failed route segment", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const error = Object.assign(new Error("Render failed"), {
      digest: "error-123",
    });

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <LocaleError error={error} retry={retry} />
      </NextIntlClientProvider>,
    );

    await waitFor(() =>
      expect(reportAppError).toHaveBeenCalledWith(error, {
        boundary: "route",
      }),
    );
    expect(screen.getByText("Error reference: error-123")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
