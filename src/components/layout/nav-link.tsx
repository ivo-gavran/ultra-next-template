"use client";

import { cn } from "cn";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";

type NavLinkProps = {
  children: React.ReactNode;
  className?: string;
  href: ComponentProps<typeof Link>["href"] & string;
};

/**
 * Header navigation link that marks the current section with `aria-current`
 * and a visible active style. Nested routes keep their parent section active.
 */
export function NavLink({ children, className, href }: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn(
        "text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground",
        className,
      )}
    >
      <Link href={href} aria-current={isActive ? "page" : undefined}>
        {children}
      </Link>
    </Button>
  );
}
