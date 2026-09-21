import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MoreHorizontal } from "lucide-react";
import { fn } from "storybook/test";

import { EmptyState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableSortButton,
  type DataTableColumns,
} from "@/components/ui/data-table";

type Project = {
  createdAt: string;
  description: string | null;
  id: string;
  name: string;
};

const projects: Project[] = [
  {
    createdAt: "Sep 15, 2026",
    description: "Replace the development mock URL when your backend is ready.",
    id: "1",
    name: "Connect the real API",
  },
  {
    createdAt: "Aug 19, 2026",
    description: "Exercise the shared mutation and notification patterns.",
    id: "2",
    name: "Invite the first team",
  },
  {
    createdAt: "Jul 4, 2026",
    description: null,
    id: "3",
    name: "Review accessibility",
  },
];

const columns: DataTableColumns<Project> = [
  {
    accessorKey: "name",
    header: () => (
      <DataTableSortButton direction="ascending" label="Name" onToggle={fn()} />
    ),
    meta: { sortDirection: "ascending" },
    cell: (info) => (
      <span className="text-foreground font-medium">
        {info.getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: () => "Description",
    cell: (info) => (
      <span className="text-muted-foreground">
        {info.getValue<string | null>() ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <DataTableSortButton direction="none" label="Created" onToggle={fn()} />
    ),
    meta: { sortDirection: "none" },
    cell: (info) => (
      <span className="text-muted-foreground tabular-nums">
        {info.getValue<string>()}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    meta: { align: "end", cellClassName: "w-px" },
    cell: (info) => (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Open actions for ${info.row.original.name}`}
      >
        <MoreHorizontal aria-hidden="true" />
      </Button>
    ),
  },
];

const meta = {
  title: "UI/DataTable",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DataTable
      caption="Projects with their description, creation date and row actions."
      columns={columns}
      data={projects}
      getRowId={(project) => project.id}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <DataTable
      caption="Projects with their description, creation date and row actions."
      columns={columns}
      data={[]}
      isLoading
      skeletonRows={3}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DataTable
      caption="Projects with their description, creation date and row actions."
      columns={columns}
      data={[]}
      emptyState={
        <EmptyState
          className="border-0"
          title="No projects match your search."
        />
      }
    />
  ),
};

export const Refetching: Story = {
  render: () => (
    <DataTable
      caption="Projects with their description, creation date and row actions."
      columns={columns}
      data={projects}
      getRowId={(project) => project.id}
      isFetching
    />
  ),
};
