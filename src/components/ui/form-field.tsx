import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

type FormFieldProps = {
  children: ReactNode;
  description?: string | undefined;
  error?: string | undefined;
  htmlFor: string;
  label: string;
};

export function FormField({
  children,
  description,
  error,
  htmlFor,
  label,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description && !error && (
        <p
          id={`${htmlFor}-description`}
          className="text-muted-foreground text-xs"
        >
          {description}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-destructive text-sm"
        >
          {error}
        </p>
      )}
    </div>
  );
}
