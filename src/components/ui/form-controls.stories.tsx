import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function FormControlsPreview() {
  return (
    <div className="grid max-w-xl gap-5">
      <FormField htmlFor="story-name" label="Project name">
        <Input id="story-name" defaultValue="Launch customer portal" />
      </FormField>
      <FormField
        htmlFor="story-description"
        label="Description"
        description="Keep the summary concise and useful."
      >
        <Textarea
          id="story-description"
          defaultValue="A reusable product workflow built on the typed API boundary."
        />
      </FormField>
      <FormField htmlFor="story-sort" label="Sort projects">
        <Select defaultValue="newest">
          <SelectTrigger id="story-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </div>
  );
}

const meta = {
  title: "UI/FormControls",
  component: FormControlsPreview,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof FormControlsPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ValidationError: Story = {
  render: () => (
    <div className="max-w-xl">
      <FormField
        htmlFor="story-invalid-name"
        label="Project name"
        error="Project name must contain at least 2 characters."
      >
        <Input
          id="story-invalid-name"
          defaultValue="A"
          aria-invalid="true"
          aria-describedby="story-invalid-name-error"
        />
      </FormField>
    </div>
  ),
};
