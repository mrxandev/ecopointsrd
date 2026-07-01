import { buildApiUrl } from "@/config/api";

export type Reward = {
  id: string;
  title: string;
  description?: string | null;
  points_required: number;
  stock: number;
  image_url?: string | null;
  status: string;
  created_at: string;
};

export type RewardRedemption = {
  id: string;
  reward_id: string;
  user_id: string;
  points_spent: number;
  status: string;
  created_at: string;
  title: string;
  image_url?: string | null;
};

type RewardsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    rewards?: Reward[];
  };
};

type RedemptionsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    redemptions?: RewardRedemption[];
  };
};

type MutationResponse = {
  success?: boolean;
  message?: string;
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

export async function getRewards() {
  const response = await fetch(buildApiUrl("/api/rewards"), {
    headers: { Accept: "application/json" },
  });
  const data = (await response.json().catch(() => null)) as RewardsResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos cargar las recompensas."));
  }

  return data?.data?.rewards ?? [];
}

export async function getMyRedemptions(token: string) {
  const response = await fetch(buildApiUrl("/api/rewards/my/redemptions"), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = (await response.json().catch(() => null)) as RedemptionsResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos cargar tus canjes."));
  }

  return data?.data?.redemptions ?? [];
}

export async function redeemReward(id: string, token: string) {
  const response = await fetch(buildApiUrl(`/api/rewards/${id}/redeem`), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = (await response.json().catch(() => null)) as MutationResponse | null;

  if (!response.ok) {
    throw new Error(getApiMessage(data, "No pudimos canjear esta recompensa."));
  }

  return data;
}
