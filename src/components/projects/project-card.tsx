import { FolderKanban, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Project } from "@/features/projects/schemas";

type ProjectCardProps = {
  project: Project;
  locale: string;
  deleteLabel: string;
  isDeleting?: boolean;
  onDelete?: (id: string) => void;
};

export function ProjectCard({
  project,
  locale,
  deleteLabel,
  isDeleting = false,
  onDelete,
}: ProjectCardProps) {
  return (
    <article className="border-border flex items-start gap-4 rounded-xl border p-4">
      <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-xl">
        <FolderKanban className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{project.name}</h3>
        {project.description && (
          <p className="text-muted-foreground mt-1 text-sm">
            {project.description}
          </p>
        )}
        <time className="text-muted-foreground mt-2 block text-xs">
          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            new Date(project.createdAt),
          )}
        </time>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={deleteLabel}
        disabled={isDeleting}
        onClick={() => onDelete?.(project.id)}
      >
        <Trash2 className="text-destructive size-4" />
      </Button>
    </article>
  );
}
