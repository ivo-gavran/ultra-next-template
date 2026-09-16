import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/async-state";

describe("async state components", () => {
  it("announces loading state", () => {
    render(<LoadingState label="Loading projects" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading projects");
  });

  it("renders an empty state", () => {
    render(<EmptyState title="No projects yet" />);

    expect(screen.getByText("No projects yet")).toBeInTheDocument();
  });

  it("allows retrying an error state", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <ErrorState
        title="Projects could not be loaded"
        retryLabel="Try again"
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
