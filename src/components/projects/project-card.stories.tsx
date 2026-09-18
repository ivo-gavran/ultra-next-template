import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ProjectCard } from "@/components/projects/project-card";

const project = {
  id: "8bb42762-23c4-4db2-8aba-2cc68fcdde15",
  name: "Launch the customer portal",
  description: "Connect the project list to the production API contract.",
  createdAt: "2026-09-15T10:00:00.000Z",
  updatedAt: "2026-09-15T10:00:00.000Z",
};

const meta = {
  title: "Features/ProjectCard",
  component: ProjectCard,
  tags: ["autodocs"],
  args: {
    project,
    locale: "en",
    deleteLabel: "Delete Launch the customer portal",
    onDelete: fn(),
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Deleting: Story = {
  args: { isDeleting: true },
};

export const WithoutDescription: Story = {
  args: {
    project: { ...project, description: null },
  },
};
