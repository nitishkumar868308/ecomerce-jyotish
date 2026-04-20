/**
 * Single source of truth for "what message to show the user after an API
 * call". The backend always returns `{ success, message, data }`. This
 * helper unwraps that envelope — both for successful responses and for
 * error responses — so callers never have to hardcode a toast string.
 *
 * Usage pattern:
 *
 *   import { apiSuccess, apiError } from "@/lib/apiMessage";
 *
 *   onSuccess: (res) => toast.success(apiSuccess(res, "Saved")),
 *   onError:   (err) => toast.error(apiError(err)),
 *
 * The second argument on `apiSuccess` is a fallback when the backend doesn't
 * include a message (rare, but exists for 204-ish endpoints).
 */

interface AxiosLikeError {
  response?: {
    data?: {
      message?: unknown;
      error?: unknown;
      errors?: unknown;
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
}

interface ApiEnvelope<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

/** Extract a user-facing message from a successful backend response. */
export function apiSuccess<T>(
  response: ApiEnvelope<T> | { data?: ApiEnvelope<T> } | undefined,
  fallback = "Done",
): string {
  if (!response) return fallback;
  // axios wraps the JSON body in `.data`; we also accept the inner body
  // directly (mutation fns that return `data.data`).
  const envelope =
    (response as { data?: ApiEnvelope<T> }).data &&
    typeof (response as { data?: ApiEnvelope<T> }).data === "object"
      ? ((response as { data?: ApiEnvelope<T> }).data as ApiEnvelope<T>)
      : (response as ApiEnvelope<T>);
  const msg = envelope?.message;
  return typeof msg === "string" && msg.trim() ? msg : fallback;
}

/**
 * Extract a user-facing error message from an axios/fetch failure. Walks a
 * handful of known shapes (NestJS ValidationPipe, generic message, network
 * error). Never returns empty — always a sentence the user can read.
 */
export function apiError(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const e = err as AxiosLikeError;
  const body = e?.response?.data;
  // Array form from NestJS ValidationPipe: message: ["name must be a string", ...]
  if (Array.isArray(body?.message) && body.message.length) {
    const first = body.message[0];
    if (typeof first === "string" && first.trim()) return first;
  }
  // Plain string message on the envelope.
  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message;
  }
  // Generic "error" field some of our custom filters surface.
  if (typeof body?.error === "string" && body.error.trim()) {
    return body.error;
  }
  // Fall back to axios-level message or status text.
  if (typeof e?.message === "string" && e.message.trim() && e.message !== "Network Error") {
    return e.message;
  }
  if (e?.response?.statusText) return e.response.statusText;
  if (e?.message === "Network Error") {
    return "Network error — please check your connection.";
  }
  return fallback;
}
