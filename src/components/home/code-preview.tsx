import { cn } from "cn";

type Token = {
  text: string;
  kind?: "keyword" | "fn" | "string" | "type" | "comment" | "prop";
};

const tokenClassName: Record<NonNullable<Token["kind"]>, string> = {
  keyword: "text-[#c4b5fd]",
  fn: "text-[#7dd3fc]",
  string: "text-[#6ee7b7]",
  type: "text-[#fcd34d]",
  comment: "text-[#8b98ab] italic",
  prop: "text-[#e2e8f0]",
};

const lines: Token[][] = [
  [
    { text: "export function ", kind: "keyword" },
    { text: "getProjects", kind: "fn" },
    { text: "(" },
  ],
  [
    { text: "  filters: " },
    { text: "ProjectListFilters", kind: "type" },
    { text: "," },
  ],
  [{ text: ") {" }],
  [
    { text: "  return ", kind: "keyword" },
    { text: "apiClient" },
    { text: "." },
    { text: "get", kind: "fn" },
    { text: "(" },
    { text: '"/projects"', kind: "string" },
    { text: ", {" },
  ],
  [{ text: "    " }, { text: "query", kind: "prop" }, { text: ": filters," }],
  [
    { text: "    " },
    { text: "schema", kind: "prop" },
    { text: ": " },
    { text: "projectsResponseSchema", kind: "type" },
    { text: "," },
  ],
  [{ text: "  });" }],
  [{ text: "}" }],
  [],
  [
    { text: "// → Promise<{ data: ProjectsPage }>  ", kind: "comment" },
    { text: "✓ validated", kind: "string" },
  ],
];

export function CodePreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "code-window overflow-hidden rounded-2xl bg-[#0b0e14] text-[#cbd5e1]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 truncate font-mono text-xs text-[#8b98ab]">
          src/features/projects/api/index.ts
        </span>
        <span className="ml-auto rounded-md bg-white/6 px-2 py-0.5 font-mono text-[10px] tracking-wide text-[#8b98ab] uppercase">
          TypeScript
        </span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 sm:text-sm">
        <code>
          {lines.map((tokens, lineIndex) => (
            <span key={lineIndex} className="flex">
              <span
                aria-hidden="true"
                className="w-7 shrink-0 text-right text-[#7c889b] select-none"
              >
                {lineIndex + 1}
              </span>
              <span className="pl-4 whitespace-pre">
                {tokens.length === 0
                  ? " "
                  : tokens.map((token, tokenIndex) => (
                      <span
                        key={tokenIndex}
                        className={token.kind && tokenClassName[token.kind]}
                      >
                        {token.text}
                      </span>
                    ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
