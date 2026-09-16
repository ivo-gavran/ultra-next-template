"use client";

import { CircleAlertIcon, FolderOpenIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type StateContainerProps = {
  className?: string;
  description?: string;
  title: string;
};

export function LoadingState({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "text-muted-foreground flex items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-sm",
        className,
      )}
    >
      <Spinner aria-hidden="true" role="presentation" />
      {label}
    </div>
  );
}

export function EmptyState({
  className,
  description,
  title,
}: StateContainerProps) {
  return (
    <div
      className={cn(
        "border-border flex flex-col items-center rounded-xl border border-dashed p-8 text-center",
        className,
      )}
    >
      <span className="bg-muted text-muted-foreground mb-3 grid size-10 place-items-center rounded-full">
        <FolderOpenIcon aria-hidden="true" className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      )}
    </div>
  );
}

export function ErrorState({
  className,
  description,
  onRetry,
  retryLabel,
  title,
}: StateContainerProps & {
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/30 bg-destructive/5 flex flex-col items-center rounded-xl border p-8 text-center",
        className,
      )}
    >
      <span className="bg-destructive/10 text-destructive mb-3 grid size-10 place-items-center rounded-full">
        <CircleAlertIcon aria-hidden="true" className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      )}
      {onRetry && retryLabel && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onRetry}
        >
          <RotateCcwIcon aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
