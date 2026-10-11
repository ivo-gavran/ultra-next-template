"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

type ProjectsPaginationProps = {
  currentPage: number;
  disabled?: boolean;
  label: string;
  nextLabel: string;
  onPageChange: (page: number) => void;
  pageLabel: string;
  previousLabel: string;
  totalPages: number;
};

export function ProjectsPagination({
  currentPage,
  disabled = false,
  label,
  nextLabel,
  onPageChange,
  pageLabel,
  previousLabel,
  totalPages,
}: ProjectsPaginationProps) {
  const previousDisabled = disabled || currentPage <= 1;
  const nextDisabled = disabled || currentPage >= totalPages;

  return (
    <Pagination aria-label={label}>
      <PaginationContent className="w-full justify-between">
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            aria-label={previousLabel}
            disabled={previousDisabled}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeftIcon data-icon="inline-start" />
            <span className="hidden sm:block">{previousLabel}</span>
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span
            className="text-muted-foreground px-2 text-sm"
            aria-live="polite"
          >
            {pageLabel}
          </span>
        </PaginationItem>
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            aria-label={nextLabel}
            disabled={nextDisabled}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <span className="hidden sm:block">{nextLabel}</span>
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
