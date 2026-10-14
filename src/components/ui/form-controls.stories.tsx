import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
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
      <Field>
        <FieldLabel htmlFor="story-name">Item name</FieldLabel>
        <Input id="story-name" defaultValue="Example name" />
      </Field>
      <Field>
        <FieldLabel htmlFor="story-description">Description</FieldLabel>
        <Textarea
          id="story-description"
          defaultValue="An example description."
        />
        <FieldDescription>
          Keep the summary concise and useful.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="story-sort">Sort items</FieldLabel>
        <Select defaultValue="newest">
          <SelectTrigger id="story-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </Field>
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
      <Field data-invalid>
        <FieldLabel htmlFor="story-invalid-name">Item name</FieldLabel>
        <Input
          id="story-invalid-name"
          defaultValue="A"
          aria-invalid="true"
          aria-describedby="story-invalid-name-error"
        />
        <FieldError id="story-invalid-name-error">
          Item name must contain at least 2 characters.
        </FieldError>
      </Field>
    </div>
  ),
};
