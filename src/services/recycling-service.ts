import { buildApiUrl } from "@/config/api";

export type RecyclingCenter = {
  id: string;
  name: string;
  description?: string | null;
  province?: string | null;
  municipality?: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  phone?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

type CentersResponse =
  | RecyclingCenter[]
  | {
      success?: boolean;
      message?: string;
      data?: {
        centers?: RecyclingCenter[];
        center?: RecyclingCenter;
      };
    };

function getApiMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export async function getRecyclingCenters(filters?: {
  province?: string;
  municipality?: string;
}) {
  const params = new URLSearchParams();

  if (filters?.province) {
    params.set("province", filters.province);
  }

  if (filters?.municipality) {
    params.set("municipality", filters.municipality);
  }

  const path = `/api/recycling/centers${params.toString() ? `?${params.toString()}` : ""}`;

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error("No pudimos cargar los centros. Revisa tu conexion.");
  }

  const data = (await response.json().catch(() => null)) as CentersResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos cargar los centros de reciclaje."));
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data?.data?.centers ?? [];
}

export async function getRecyclingCenterById(id: string) {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(`/api/recycling/centers/${id}`), {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error("No pudimos cargar este centro. Revisa tu conexion.");
  }

  const data = (await response.json().catch(() => null)) as CentersResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos cargar este centro de reciclaje."));
  }

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data?.data?.center ?? null;
}
