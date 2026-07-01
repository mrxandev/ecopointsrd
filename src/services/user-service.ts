import { buildApiUrl } from "@/config/api";

export type UserProfile = {
  id: string;
  cedula?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  is_verified?: boolean;
  province?: string | null;
  municipality?: string | null;
  address?: string | null;
  profile_image?: string | null;
  points: number;
  total_points_earned: number;
  total_points_redeemed: number;
  completed_missions: number;
  created_at: string;
  updated_at: string;
};

export type PointTransaction = {
  id: string;
  user_id: string;
  points: number;
  transaction_type: "EARNED" | "REDEEMED" | "BONUS" | "PENALTY" | string;
  description: string;
  mission_id?: string | null;
  reward_id?: string | null;
  redemption_id?: string | null;
  created_at: string;
};

type ProfileResponse = {
  success?: boolean;
  message?: string;
  data?: {
    user?: UserProfile;
  };
};

type PointsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    points?: number;
    total_points_earned?: number;
    total_points_redeemed?: number;
  };
};

type TransactionsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    transactions?: PointTransaction[];
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

function authHeaders(token: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getMyProfile(token: string) {
  const response = await fetch(buildApiUrl("/api/users/me"), {
    headers: authHeaders(token),
  });
  const data = (await response.json().catch(() => null)) as ProfileResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos cargar tu perfil."));
  }

  if (!data?.data?.user) {
    throw new Error("El servidor no devolvio un perfil valido.");
  }

  return data.data.user;
}

export async function updateMyProfile(
  token: string,
  profile: Partial<
    Pick<
      UserProfile,
      "first_name" | "last_name" | "phone" | "province" | "municipality" | "address" | "profile_image"
    >
  >,
) {
  const response = await fetch(buildApiUrl("/api/users/me"), {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });
  const data = (await response.json().catch(() => null)) as ProfileResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos actualizar tu perfil."));
  }

  if (!data?.data?.user) {
    throw new Error("El servidor no devolvio un perfil valido.");
  }

  return data.data.user;
}

export async function getMyPoints(token: string) {
  const response = await fetch(buildApiUrl("/api/users/me/points"), {
    headers: authHeaders(token),
  });
  const data = (await response.json().catch(() => null)) as PointsResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos cargar tus puntos."));
  }

  return data?.data ?? { points: 0, total_points_earned: 0, total_points_redeemed: 0 };
}

export async function getMyPointTransactions(token: string) {
  const response = await fetch(buildApiUrl("/api/users/me/transactions"), {
    headers: authHeaders(token),
  });
  const data = (await response.json().catch(() => null)) as TransactionsResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos cargar tu historial de puntos."));
  }

  return data?.data?.transactions ?? [];
}
