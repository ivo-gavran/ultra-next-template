import { cn } from "@/lib/utils";

export function RouteStateShell({
  as: Component = "div",
  children,
  className,
}: {
  as?: "div" | "main";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Component
      className={cn(
        "mx-auto flex min-h-[65vh] w-full max-w-3xl items-center px-5 py-16",
        className,
      )}
    >
      <div className="w-full">{children}</div>
    </Component>
  );
}
