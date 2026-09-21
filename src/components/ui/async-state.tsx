"use client";

import { CircleAlertIcon, FolderOpenIcon, RotateCcwIcon } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

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
    <Empty
      role="status"
      className={cn(
        "text-muted-foreground min-h-24 flex-row gap-2 border",
        className,
      )}
    >
      <Spinner aria-hidden="true" role="presentation" />
      {label}
    </Empty>
  );
}

export function EmptyState({
  className,
  description,
  title,
}: StateContainerProps) {
  return (
    <Empty className={cn("border", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpenIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
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
    <Empty
      role="alert"
      className={cn("border-destructive/30 bg-destructive/5 border", className)}
    >
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-destructive/10 text-destructive"
        >
          <CircleAlertIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {onRetry && retryLabel && (
        <EmptyContent>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RotateCcwIcon aria-hidden="true" />
            {retryLabel}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
