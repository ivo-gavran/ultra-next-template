import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DataTable,
  DataTableSortButton,
  type DataTableColumns,
} from "@/components/ui/data-table";

type Row = { id: string; name: string; size: number };

const rows: Row[] = [
  { id: "1", name: "Alpha", size: 2 },
  { id: "2", name: "Beta", size: 5 },
];

const columns: DataTableColumns<Row> = [
  { accessorKey: "name", header: () => "Name" },
  { accessorKey: "size", header: () => "Size", meta: { align: "end" } },
];

afterEach(cleanup);

describe("DataTable", () => {
  it("renders a described table with headers and rows", () => {
    render(<DataTable caption="Sample rows" columns={columns} data={rows} />);

    expect(screen.getByRole("table", { name: "Sample rows" })).toBeVisible();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getByRole("cell", { name: "Alpha" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "Beta" })).toBeVisible();
  });

  it("exposes server-driven sort state through aria-sort", () => {
    render(
      <DataTable
        caption="Sample rows"
        columns={[
          {
            accessorKey: "name",
            header: () => "Name",
            meta: { sortDirection: "descending" },
          },
        ]}
        data={rows}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  it("renders placeholder rows instead of data while loading", () => {
    render(
      <DataTable
        caption="Sample rows"
        columns={columns}
        data={[]}
        isLoading
        skeletonRows={4}
      />,
    );

    // One header row plus the requested placeholder rows.
    expect(screen.getAllByRole("row")).toHaveLength(5);
    expect(
      screen.queryByRole("cell", { name: "Alpha" }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state across every column when there are no rows", () => {
    render(
      <DataTable
        caption="Sample rows"
        columns={columns}
        data={[]}
        emptyState={<p>Nothing here</p>}
      />,
    );

    expect(screen.getByText("Nothing here")).toBeVisible();
    expect(screen.getByRole("cell")).toHaveAttribute("colspan", "2");
  });

  it("prefers rows over the empty state once data arrives", () => {
    render(
      <DataTable
        caption="Sample rows"
        columns={columns}
        data={rows}
        emptyState={<p>Nothing here</p>}
      />,
    );

    expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
  });
});

describe("DataTableSortButton", () => {
  it("reports the sort intent when activated", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <DataTableSortButton direction="none" label="Name" onToggle={onToggle} />,
    );

    await user.click(screen.getByRole("button", { name: "Name" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
