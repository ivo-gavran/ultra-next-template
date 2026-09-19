import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  label: string;
  nextLabel: string;
  onPageChange: (page: number) => void;
  pageLabel: string;
  previousLabel: string;
  totalPages: number;
};

export function Pagination({
  currentPage,
  label,
  nextLabel,
  onPageChange,
  pageLabel,
  previousLabel,
  totalPages,
}: PaginationProps) {
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft />
        {previousLabel}
      </Button>
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {pageLabel}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {nextLabel}
        <ChevronRight />
      </Button>
    </nav>
  );
}
