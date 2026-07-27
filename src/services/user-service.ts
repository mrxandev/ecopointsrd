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

export type RankingUser = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  province?: string | null;
  municipality?: string | null;
  profile_image?: string | null;
  points: number;
  total_points_earned?: number;
  completed_missions?: number;
  rank: number;
  previous_rank?: number | null;
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

type RankingResponse = {
  success?: boolean;
  message?: string;
  data?:
    | RankingUser[]
    | {
        ranking?: RankingUser[];
        rankings?: RankingUser[];
        users?: RankingUser[];
        leaderboard?: RankingUser[];
        leaders?: RankingUser[];
        top_users?: RankingUser[];
        current_user?: RankingUser;
        current_user_rank?: number | null;
        my_rank?: number | null;
        user_rank?: number | null;
        rank?: number | null;
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

function createApiError(data: unknown, fallback: string, status: number) {
  const error = new Error(getApiMessage(data, fallback));
  error.name = String(status);
  return error;
}

function authHeaders(token: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function jsonHeaders(token?: string | null) {
  return token ? authHeaders(token) : { Accept: "application/json" };
}

export async function getMyProfile(token: string) {
  const response = await fetch(buildApiUrl("/api/users/me"), {
    headers: authHeaders(token),
  });
  const data = (await response.json().catch(() => null)) as ProfileResponse | null;

  if (!response.ok) {
    throw createApiError(data, "No pudimos cargar tu perfil.", response.status);
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
    throw createApiError(data, "No pudimos actualizar tu perfil.", response.status);
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
    throw createApiError(data, "No pudimos cargar tus puntos.", response.status);
  }

  return data?.data ?? { points: 0, total_points_earned: 0, total_points_redeemed: 0 };
}

export async function getMyPointTransactions(token: string) {
  const response = await fetch(buildApiUrl("/api/users/me/transactions"), {
    headers: authHeaders(token),
  });
  const data = (await response.json().catch(() => null)) as TransactionsResponse | null;

  if (!response.ok) {
    throw createApiError(data, "No pudimos cargar tu historial de puntos.", response.status);
  }

  return data?.data?.transactions ?? [];
}

function normalizeRankingUser(user: Partial<RankingUser>, index: number): RankingUser {
  const earnedPoints = user.total_points_earned ?? user.points ?? 0;

  return {
    ...user,
    id: String(user.id ?? user.email ?? index + 1),
    points: user.points ?? earnedPoints,
    rank: user.rank ?? index + 1,
  };
}

function normalizeRankingPayload(data: RankingResponse | null) {
  const payload = data?.data;
  const ranking = Array.isArray(payload)
    ? payload
    : payload?.ranking ??
      payload?.rankings ??
      payload?.users ??
      payload?.leaderboard ??
      payload?.leaders ??
      payload?.top_users ??
      [];

  const users = ranking.map(normalizeRankingUser).sort((a, b) => a.rank - b.rank);
  const currentUserRank = Array.isArray(payload)
    ? null
    : payload?.current_user_rank ??
      payload?.my_rank ??
      payload?.user_rank ??
      payload?.rank ??
      payload?.current_user?.rank ??
      null;

  return {
    users,
    currentUserRank,
  };
}

export async function getUserRanking(token?: string | null) {
  const paths = ["/api/points/ranking?limit=1000", "/api/users/leaderboard", "/api/users/ranking"];
  let lastError: Error | null = null;

  for (const path of paths) {
    const response = await fetch(buildApiUrl(path), {
      headers: jsonHeaders(token),
    });
    const data = (await response.json().catch(() => null)) as RankingResponse | null;

    if (response.ok) {
      return normalizeRankingPayload(data);
    }

    lastError = createApiError(data, "No pudimos cargar el ranking.", response.status);

    if (response.status !== 404 && response.status !== 401) {
      throw lastError;
    }
  }

  throw lastError ?? new Error("No pudimos cargar el ranking.");
}

export async function searchUserByCedula(cedula: string, token: string): Promise<UserProfile> {
  const rawInput = cedula.trim();
  const cleanCedula = rawInput.replace(/\D/g, "");
  if (!cleanCedula) {
    throw new Error("Ingresa un número de cédula válido.");
  }

  const searchTerms = Array.from(new Set([cleanCedula, rawInput])).filter(Boolean);
  let usersList: UserProfile[] = [];
  let lastError: Error | null = null;

  for (const term of searchTerms) {
    try {
      const response = await fetch(buildApiUrl(`/api/admin/users?search=${encodeURIComponent(term)}`), {
        headers: jsonHeaders(token),
      });

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        data?: {
          users?: UserProfile[];
        };
      } | null;

      if (response.ok && data?.data?.users?.length) {
        usersList = data.data.users;
        break;
      } else if (!response.ok) {
        lastError = createApiError(data, "No pudimos realizar la búsqueda por cédula.", response.status);
      }
    } catch {
      lastError = new Error("No pudimos conectar con el servidor. Revisa tu conexión.");
    }
  }

  const matchedUser = usersList.find(
    (u) =>
      u.cedula?.replace(/\D/g, "") === cleanCedula ||
      u.cedula === rawInput ||
      u.cedula?.includes(cleanCedula)
  ) ?? usersList[0];

  if (!matchedUser) {
    if (lastError) {
      throw lastError;
    }
    throw new Error(`No encontramos ningún usuario registrado con la cédula "${cedula}".`);
  }

  return matchedUser;
}
