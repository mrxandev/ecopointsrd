import { buildApiUrl } from "@/config/api";

export type Mission = {
  id: string;
  title: string;
  description: string;
  mission_type: string;
  status: string;
  points_reward: number;
  start_date: string | null;
  end_date: string | null;
  province: string | null;
  municipality: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  max_participants: number | null;
  requires_evidence: boolean;
  requires_qr_validation: boolean;
  requires_approval: boolean;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  organization_name?: string;
  registered_count?: number;
  my_registration_status?: "REGISTERED" | "COMPLETED" | "CANCELLED" | string | null;
};

export type MissionRegistration = {
  id: string;
  mission_id: string;
  user_id: string;
  status: "REGISTERED" | "COMPLETED" | "CANCELLED" | string;
  registered_at?: string;
  updated_at?: string;
  title: string;
  description: string;
  mission_type: string;
  mission_status: string;
  points_reward: number;
};

type MissionsResponse =
  | Mission[]
  | {
      success?: boolean;
      message?: string;
      data?: {
        missions?: Mission[];
      };
    };

type MissionResponse =
  | Mission
  | {
      success?: boolean;
      message?: string;
      data?: {
        mission?: Mission;
      } & Partial<Mission>;
    };

type MutationResponse = {
  success?: boolean;
  message?: string;
  errors?: string[];
};

type RegistrationsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    registrations?: MissionRegistration[];
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

export async function getPublishedMissions() {
  let response: Response;

  try {
    response = await fetch(buildApiUrl("/api/missions?status=PUBLISHED"), {
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new Error("No pudimos cargar las misiones. Revisa tu conexion.");
  }

  const data = (await response.json().catch(() => null)) as MissionsResponse | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : "No pudimos cargar las misiones disponibles.";

    throw new Error(message);
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data?.data?.missions ?? [];
}

export async function getMissionById(id: string, token?: string | null) {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(`/api/missions/${id}`), {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error("No pudimos cargar esta mision. Revisa tu conexion.");
  }

  const data = (await response.json().catch(() => null)) as MissionResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos cargar esta mision."));
  }

  if (!data) {
    return null;
  }

  if ("id" in data) {
    return data;
  }

  return data.data?.mission ?? (data.data?.id ? (data.data as Mission) : null);
}

export async function getMyMissionRegistrations(token: string) {
  let response: Response;

  try {
    response = await fetch(buildApiUrl("/api/missions/my/registrations"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error("No pudimos cargar tus misiones. Revisa tu conexion.");
  }

  const data = (await response.json().catch(() => null)) as RegistrationsResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos cargar tus misiones."));
  }

  return data?.data?.registrations ?? [];
}

export async function registerMission(id: string, token: string) {
  return mutateMissionRegistration(id, token, "POST", "No pudimos inscribirte en esta mision.");
}

export async function unregisterMission(id: string, token: string) {
  return mutateMissionRegistration(
    id,
    token,
    "DELETE",
    "No pudimos cancelar tu inscripcion.",
  );
}

export async function uploadMissionEvidence(
  id: string,
  token: string,
  evidence: { file_url: string; description?: string },
) {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(`/api/missions/${id}/evidences`), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(evidence),
    });
  } catch {
    throw new Error("Servidor no disponible. Intenta de nuevo en unos minutos.");
  }

  const data = (await response.json().catch(() => null)) as MutationResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos subir la evidencia."));
  }

  return data;
}

async function mutateMissionRegistration(
  id: string,
  token: string,
  method: "POST" | "DELETE",
  fallbackMessage: string,
) {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(`/api/missions/${id}/register`), {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error("Servidor no disponible. Intenta de nuevo en unos minutos.");
  }

  const data = (await response.json().catch(() => null)) as MutationResponse | null;

  if (!response.ok) {
    const error = new Error(getApiMessage(data, fallbackMessage));
    error.name = String(response.status);
    throw error;
  }

  return data;
}
