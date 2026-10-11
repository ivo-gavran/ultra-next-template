"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type ProjectSearchFieldProps = {
  currentSearch: string;
  onCommit: (search: string) => void;
};

export function ProjectSearchField({
  currentSearch,
  onCommit,
}: ProjectSearchFieldProps) {
  const t = useTranslations("Projects");
  const [value, setValue] = useState(currentSearch);

  useEffect(() => {
    const search = value.trim();
    if (search === currentSearch) return;

    const timer = window.setTimeout(() => onCommit(search), 300);
    return () => window.clearTimeout(timer);
  }, [currentSearch, onCommit, value]);

  return (
    <Field className="sm:w-auto">
      <FieldLabel htmlFor="project-search">{t("searchLabel")}</FieldLabel>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          id="project-search"
          type="search"
          className="h-9 w-full pl-9 sm:w-80"
          value={value}
          maxLength={80}
          placeholder={t("searchPlaceholder")}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
    </Field>
  );
}
