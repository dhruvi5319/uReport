export interface ApiError {
  error: string;
  message: string;
}

export type ApiResult<T> = { data: T; error: null } | { data: null; error: ApiError };
