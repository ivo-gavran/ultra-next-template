import "@tanstack/react-query";

type AppQueryMeta = Record<string, unknown> & {
  suppressErrorToast?: boolean;
};

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: AppQueryMeta;
    queryMeta: AppQueryMeta;
  }
}
