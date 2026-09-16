import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ToastProvider, useToast } from "@/components/ui/toast";

function ToastTrigger() {
  const toast = useToast();

  return (
    <button type="button" onClick={() => toast.error("Save failed")}>
      Show error
    </button>
  );
}

describe("ToastProvider", () => {
  it("announces and dismisses an error toast", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider dismissLabel="Dismiss notification">
        <ToastTrigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show error" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Save failed");

    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
