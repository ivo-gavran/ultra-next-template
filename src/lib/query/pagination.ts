export type CursorPage<TItem, TCursor = string> = {
  items: readonly TItem[];
  nextCursor: TCursor | null;
};

export type NumberedPage<TItem> = {
  items: readonly TItem[];
  page: number;
  totalPages: number;
};

export function getNextCursorPageParam<TCursor>(
  lastPage: Pick<CursorPage<unknown, TCursor>, "nextCursor">,
) {
  return lastPage.nextCursor ?? undefined;
}

export function getNextNumberedPageParam(
  lastPage: Pick<NumberedPage<unknown>, "page" | "totalPages">,
) {
  return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
}
