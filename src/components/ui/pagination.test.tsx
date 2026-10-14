import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

describe("Pagination", () => {
  it("exposes page navigation and marks only the current page", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="?page=1" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="?page=1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="?page=2" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="?page=3" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    const navigation = screen.getByRole("navigation", { name: "pagination" });
    expect(within(navigation).getByRole("link", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(navigation).getByRole("link", { name: "1" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      within(navigation).getByRole("link", { name: "Go to previous page" }),
    ).toHaveAttribute("href", "?page=1");
    expect(
      within(navigation).getByRole("link", { name: "Go to next page" }),
    ).toHaveAttribute("href", "?page=3");
    expect(within(navigation).getAllByRole("link")).toHaveLength(4);
  });

  it("accepts localized navigation and control labels", () => {
    render(
      <Pagination aria-label="Navigacija stranica">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="?page=1"
              text="Prethodna"
              aria-label="Prethodna stranica"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="?page=3"
              text="Sljedeća"
              aria-label="Sljedeća stranica"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    const navigation = screen.getByRole("navigation", {
      name: "Navigacija stranica",
    });
    expect(
      within(navigation).getByRole("link", { name: "Prethodna stranica" }),
    ).toHaveTextContent("Prethodna");
    expect(
      within(navigation).getByRole("link", { name: "Sljedeća stranica" }),
    ).toHaveTextContent("Sljedeća");
  });
});
