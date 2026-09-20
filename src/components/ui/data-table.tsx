"use client";

import {
  flexRender,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableColumnMeta = {
  /** Horizontal alignment applied to the header and every body cell. */
  align?: "end" | "start";
  /** Extra classes for the body cells of this column. */
  cellClassName?: string;
  /** Extra classes for the header cell of this column. */
  headerClassName?: string;
  /**
   * Sort state for server-driven sorting, mapped onto `aria-sort` of the header
   * cell. Leave unset for columns that cannot be sorted.
   */
  sortDirection?: "ascending" | "descending" | "none";
};

/**
 * Only the core feature set is registered. Searching, sorting and pagination
 * are owned by the URL and resolved by the API, so the table must never
 * re-derive them from the current page of rows.
 */
const dataTableFeatures = tableFeatures({
  columnMeta: {} as DataTableColumnMeta,
});

type DataTableFeatures = typeof dataTableFeatures;

type DataTableColumns<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData,
  // Each column narrows its own value type, which a shared array cannot express.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[];

type DataTableProps<TData extends RowData> = {
  /** Accessible description of the table, rendered as a visually hidden caption. */
  caption: string;
  className?: string;
  columns: DataTableColumns<TData>;
  data: TData[];
  /** Rendered instead of rows when there is no data and nothing is loading. */
  emptyState?: ReactNode;
  /** Stable row identity, so row state stays attached to the right record. */
  getRowId?: ((row: TData) => string) | undefined;
  /** Dims the rows while a background refetch is in flight. */
  isFetching?: boolean;
  /** Replaces the rows with placeholders during the first load. */
  isLoading?: boolean;
  skeletonRows?: number;
};

function DataTable<TData extends RowData>({
  caption,
  className,
  columns,
  data,
  emptyState,
  getRowId,
  isFetching = false,
  isLoading = false,
  skeletonRows = 3,
}: DataTableProps<TData>) {
  const table = useTable({
    columns,
    data,
    features: dataTableFeatures,
    ...(getRowId ? { getRowId } : {}),
  });
  const rows = table.getRowModel().rows;

  return (
    <div
      className={cn("overflow-hidden rounded-lg border", className)}
      data-slot="data-table"
    >
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta;

                return (
                  <TableHead
                    key={header.id}
                    aria-sort={meta?.sortDirection}
                    className={cn(
                      "h-11 px-4",
                      meta?.align === "end" && "text-right",
                      meta?.headerClassName,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody
          className={cn(
            "transition-opacity",
            isFetching && !isLoading && "opacity-60",
          )}
        >
          {isLoading &&
            Array.from({ length: skeletonRows }, (_row, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`}>
                {columns.map((_column, columnIndex) => (
                  <TableCell
                    key={`skeleton-cell-${columnIndex}`}
                    className="px-4 py-3"
                  >
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!isLoading && rows.length === 0 && emptyState ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : null}

          {!isLoading &&
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;

                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-4 py-3",
                        meta?.align === "end" && "text-right",
                        meta?.cellClassName,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

type DataTableSortButtonProps = {
  /** Mirrors the `aria-sort` value of the surrounding header cell. */
  direction: "ascending" | "descending" | "none";
  label: string;
  onToggle: () => void;
};

function DataTableSortButton({
  direction,
  label,
  onToggle,
}: DataTableSortButtonProps) {
  const SortIcon =
    direction === "ascending"
      ? ArrowUp
      : direction === "descending"
        ? ArrowDown
        : ChevronsUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-slot="data-table-sort-button"
      className="-ml-3 h-8 font-medium"
      onClick={onToggle}
    >
      {label}
      <SortIcon
        aria-hidden="true"
        className={cn(
          "size-3.5",
          direction === "none" && "text-muted-foreground",
        )}
      />
    </Button>
  );
}

export { DataTable, DataTableSortButton, dataTableFeatures };
export type { DataTableColumnMeta, DataTableColumns, DataTableFeatures };
