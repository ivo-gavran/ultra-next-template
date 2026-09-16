import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const colors = [
  ["Primary", "bg-primary"],
  ["Secondary", "bg-secondary"],
  ["Accent", "bg-accent"],
  ["Muted", "bg-muted"],
  ["Destructive", "bg-destructive"],
] as const;

function ThemeShowcase() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Ultra theme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {colors.map(([name, className]) => (
            <div key={name} className="text-muted-foreground space-y-2 text-xs">
              <div className={`h-16 rounded-lg border ${className}`} />
              {name}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </CardContent>
    </Card>
  );
}

const meta = {
  title: "Foundations/Theme",
  component: ThemeShowcase,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ThemeShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};

export const Dark: Story = {
  decorators: [
    (Story) => (
      <div className="dark bg-background text-foreground rounded-xl p-6">
        <Story />
      </div>
    ),
  ],
};
