export { createQueryClient } from "@/lib/query/client";
export { createEntityQueryFactory } from "@/lib/query/factory";
export {
  createEntityQueryKeys,
  type EntityId,
  type QueryFilters,
} from "@/lib/query/keys";
export {
  optimisticallyUpdateQuery,
  type OptimisticUpdate,
} from "@/lib/query/optimistic";
export {
  getNextCursorPageParam,
  getNextNumberedPageParam,
  type CursorPage,
  type NumberedPage,
} from "@/lib/query/pagination";
