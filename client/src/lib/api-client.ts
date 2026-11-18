export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = { data: T[]; meta: PaginationMeta };

type FieldError = { field: string; message: string };

export class ApiError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(
    readonly status: number,
    message: string,
    errors: FieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.fieldErrors = Object.fromEntries(errors.map((error) => [error.field, error.message]));
  }
}

type QueryValue = string | number | undefined | null;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  /** Lets the request finish even if the page is closing. */
  keepalive?: boolean;
};

const API_BASE = "/api/v1";

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const queryString = params.toString();
  return `${API_BASE}${path}${queryString ? `?${queryString}` : ""}`;
}

function redirectToLogin() {
  if (typeof window === "undefined" || window.location.pathname === "/login") return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  // A full page load on purpose: it discards all in-memory data from the expired session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?reason=expired&next=${next}`);
}

/** Calls the REST API and returns the full `{ data, meta, message }` envelope. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const { method = "GET", query, body, signal, keepalive } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      keepalive,
      credentials: "same-origin",
      // FormData (file uploads) sets its own multipart content type.
      headers: body === undefined || body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    if (response.status === 401) redirectToLogin();
    throw new ApiError(
      response.status,
      payload?.message ?? "Something went wrong. Please try again.",
      payload?.errors,
    );
  }

  return payload as { data: T; meta?: PaginationMeta; message?: string };
}

export async function apiGet<T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal) {
  return (await apiRequest<T>(path, { query, signal })).data;
}

export async function apiGetPage<T>(
  path: string,
  query?: Record<string, QueryValue>,
  signal?: AbortSignal,
): Promise<Paginated<T>> {
  const { data, meta } = await apiRequest<T[]>(path, { query, signal });
  return { data, meta: meta ?? { page: 1, limit: data.length, total: data.length, totalPages: 1 } };
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
