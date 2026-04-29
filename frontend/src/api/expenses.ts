import type { ApiError, ExpenseFormInput, ExpenseListResponse, ExpenseSort } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 60000;
const GET_RETRY_DELAYS_MS = [400, 1200];

function createTimeoutError(message: string): ApiError {
  return {
    error: {
      code: "request_timeout",
      message,
    },
  };
}

function createNetworkError(message: string): ApiError {
  return {
    error: {
      code: "network_error",
      message,
    },
  };
}

async function fetchWithTimeout(
  input: string,
  init?: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw createTimeoutError(
        "The server took too long to respond. It may be waking up from an idle state. You can safely retry with the same form data.",
      );
    }
    if (error instanceof TypeError) {
      throw createNetworkError(
        "Network error. The server may be unavailable or still waking up. Retry is safe.",
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback: ApiError = {
      error: {
        code: "request_failed",
        message: "Request failed.",
      },
    };
    throw (payload ?? fallback) as ApiError;
  }

  return payload as T;
}

async function sleep(delayMs: number): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

function isRetryable(error: unknown): boolean {
  const apiError = error as ApiError | undefined;
  return (
    apiError?.error?.code === "request_timeout" ||
    error instanceof TypeError
  );
}

export async function fetchExpenses(
  category?: string,
  sort: ExpenseSort = "date_desc",
): Promise<ExpenseListResponse> {
  const params = new URLSearchParams({ sort });
  if (category) {
    params.set("category", category);
  }

  const url = `${API_BASE_URL}/expenses?${params.toString()}`;

  for (let attempt = 0; attempt <= GET_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url);
      return await parseResponse<ExpenseListResponse>(response);
    } catch (error) {
      const isLastAttempt = attempt === GET_RETRY_DELAYS_MS.length;
      if (isLastAttempt || !isRetryable(error)) {
        throw error;
      }
      await sleep(GET_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw {
    error: {
      code: "request_failed",
      message: "Unable to load expenses.",
    },
  } as ApiError;
}

export async function createExpense(
  payload: ExpenseFormInput,
  idempotencyKey: string,
) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}
