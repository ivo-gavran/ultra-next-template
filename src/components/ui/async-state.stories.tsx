import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/async-state";

const meta = {
  title: "UI/Async states",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  render: () => <LoadingState label="Loading items…" />,
};

export const Empty: Story = {
  render: () => (
    <EmptyState
      title="No items yet"
      description="Create your first item to get started."
    />
  ),
};

export const Error: Story = {
  render: () => (
    <ErrorState
      title="Items could not be loaded"
      description="Check your connection and try again."
      retryLabel="Try again"
      onRetry={fn()}
    />
  ),
};
