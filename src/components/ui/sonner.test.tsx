import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  toast.dismiss();
  cleanup();
});

describe("Toaster", () => {
  it("announces and dismisses a localized error toast", async () => {
    const user = userEvent.setup();

    render(
      <Toaster
        closeButton
        toastOptions={{ closeButtonAriaLabel: "Dismiss notification" }}
      />,
    );

    act(() => {
      toast.error("Save failed");
    });

    expect(await screen.findByText("Save failed")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    await waitFor(() =>
      expect(screen.queryByText("Save failed")).not.toBeInTheDocument(),
    );
  });
});
