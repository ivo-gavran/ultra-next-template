import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Rocket } from "@/components/icons/generated";

const meta = {
  title: "Foundations/Custom icons",
  component: Rocket,
  args: {
    className: "size-12 text-primary",
    title: "Rocket",
  },
} satisfies Meta<typeof Rocket>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GeneratedSvg: Story = {};
