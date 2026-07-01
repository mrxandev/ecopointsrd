const API_ENV = process.env.EXPO_PUBLIC_API_ENV ?? "local";

const LOCAL_URL =
  process.env.EXPO_PUBLIC_API_LOCAL_URL ?? "http://localhost:3000/";
const PRODUCTION_URL =
  process.env.EXPO_PUBLIC_API_PRODUCTION_URL ??
  "https://backend-ecopointsrd.onrender.com/";

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(
  API_ENV === "production" ? PRODUCTION_URL : LOCAL_URL,
);

export const API_LOGIN_PATH =
  process.env.EXPO_PUBLIC_API_LOGIN_PATH ?? "/api/auth/login";

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
}
