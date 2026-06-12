export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type QueryParams = Record<
  string,
  boolean | null | number | string | undefined
>;

export type RequestBody = FormData | Record<string, unknown> | undefined;
