import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectsPagination } from "@/features/projects/components/projects-pagination";

afterEach(cleanup);

describe("ProjectsPagination", () => {
  it("announces its state and requests adjacent pages", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <ProjectsPagination
        currentPage={2}
        totalPages={3}
        label="Projects pagination"
        previousLabel="Previous"
        nextLabel="Next"
        pageLabel="Page 2 of 3"
        onPageChange={onPageChange}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Projects pagination" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toHaveAttribute(
      "aria-live",
      "polite",
    );

    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it("disables navigation at the range boundaries", () => {
    const { rerender } = render(
      <ProjectsPagination
        currentPage={1}
        totalPages={2}
        label="Pagination"
        previousLabel="Previous"
        nextLabel="Next"
        pageLabel="Page 1 of 2"
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    rerender(
      <ProjectsPagination
        currentPage={2}
        totalPages={2}
        label="Pagination"
        previousLabel="Previous"
        nextLabel="Next"
        pageLabel="Page 2 of 2"
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
