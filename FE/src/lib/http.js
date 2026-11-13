import { API_URL } from "../config/env";
import { REQUEST_TIMEOUT_MS } from "../constants/app";
import { useSession } from "../store/session";

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function buildUrl(path, query) {
  if (!query) return API_URL + path;
  const params = Object.entries(query).filter(
    ([, value]) => value !== undefined && value !== "",
  );
  return params.length
    ? `${API_URL}${path}?${new URLSearchParams(params)}`
    : API_URL + path;
}

async function request(method, path, { body, query } = {}) {
  const { userId, token } = useSession.getState();
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body && JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error.name === "TimeoutError";
    throw new ApiError(
      timedOut
        ? "The server took too long to respond."
        : "Cannot reach the server.",
      0,
    );
  }

  const json = await response.json().catch(() => null);
  if (useSession.getState().userId !== userId) {
    throw new ApiError(
      "The selected traveller changed. Please retry with the current profile.",
      0,
      "IDENTITY_CHANGED",
    );
  }
  if (!response.ok) {
    throw new ApiError(
      json?.message || `Request failed (${response.status})`,
      response.status,
      json?.error?.code,
    );
  }
  if (!json || json.success === false)
    throw new ApiError(
      json?.message || "The server returned an unexpected response.",
      response.status,
    );
  return json?.data ?? null;
}

export const http = {
  get: (path, query) => request("GET", path, { query }),
  post: (path, body) => request("POST", path, { body }),
  patch: (path, body) => request("PATCH", path, { body }),
  delete: (path) => request("DELETE", path),
};
