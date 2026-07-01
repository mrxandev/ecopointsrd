import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Image } from "expo-image";

import { useAuth } from "@/hooks/use-auth";
import {
  getMyRedemptions,
  getRewards,
  redeemReward,
  type Reward,
  type RewardRedemption,
} from "@/services/reward-service";
import { getMyPoints } from "@/services/user-service";

const VIEWS = ["Disponibles", "Mis canjes"] as const;

export function RewardsScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [view, setView] = useState<(typeof VIEWS)[number]>("Disponibles");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRewards = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        setError(null);
        setMessage(null);
        const [nextRewards, nextRedemptions, nextPoints] = await Promise.all([
          getRewards(),
          token ? getMyRedemptions(token) : Promise.resolve([]),
          token ? getMyPoints(token) : Promise.resolve({ points: 0 }),
        ]);
        setRewards(nextRewards);
        setRedemptions(nextRedemptions);
        setPoints(nextPoints.points ?? 0);
      } catch (rewardError) {
        setError(
          rewardError instanceof Error ? rewardError.message : "No pudimos cargar recompensas.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadRewards();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadRewards]);

  const sortedRewards = useMemo(
    () => [...rewards].sort((a, b) => a.points_required - b.points_required),
    [rewards],
  );

  async function handleRedeem(reward: Reward) {
    if (!token) {
      setMessage("Inicia sesion nuevamente para canjear.");
      return;
    }

    setRedeemingId(reward.id);
    setMessage(null);

    try {
      const response = await redeemReward(reward.id, token);
      setMessage(response?.message ?? "Recompensa canjeada correctamente.");
      await loadRewards("refresh");
    } catch (redeemError) {
      setMessage(redeemError instanceof Error ? redeemError.message : "No pudimos canjear.");
    } finally {
      setRedeemingId(null);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadRewards("refresh")} />
      }
      style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f4f7f3" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 16 }}
    >
      <View style={{ gap: 4 }}>
        <Text
          selectable
          style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 28, fontWeight: "900" }}
        >
          Recompensas
        </Text>
        <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 14 }}>
          Tienes {new Intl.NumberFormat("es-DO").format(points)} puntos disponibles.
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          borderRadius: 8,
          backgroundColor: isDark ? "#17231f" : "#ffffff",
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#dbe4df",
          padding: 4,
        }}
      >
        {VIEWS.map((item) => {
          const isActive = item === view;

          return (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => setView(item)}
              style={{
                flex: 1,
                minHeight: 38,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                backgroundColor: isActive ? "#28734f" : "transparent",
              }}
            >
              <Text
                style={{
                  color: isActive ? "#ffffff" : isDark ? "#dce8e1" : "#34483e",
                  fontSize: 13,
                  fontWeight: "800",
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color="#28734f" />
          <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c" }}>
            Cargando recompensas...
          </Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <MessageCard message={error} danger />
      ) : null}

      {!isLoading && message ? <MessageCard message={message} danger={message.includes("No pudimos") || message.includes("insuficientes")} /> : null}

      {!isLoading && !error && view === "Disponibles"
        ? sortedRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              points={points}
              redeemingId={redeemingId}
              reward={reward}
              onRedeem={() => void handleRedeem(reward)}
            />
          ))
        : null}

      {!isLoading && !error && view === "Mis canjes"
        ? redemptions.map((redemption) => (
            <RedemptionCard key={redemption.id} redemption={redemption} />
          ))
        : null}

      {!isLoading &&
      !error &&
      ((view === "Disponibles" && sortedRewards.length === 0) ||
        (view === "Mis canjes" && redemptions.length === 0)) ? (
        <View
          style={{
            minHeight: 220,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: isDark ? "#17231f" : "#ffffff",
            padding: 20,
          }}
        >
          <Text selectable style={{ color: isDark ? "#f3fbf6" : "#17231f", fontWeight: "900" }}>
            {view === "Disponibles" ? "No hay recompensas activas." : "Aun no tienes canjes."}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function RewardCard({
  onRedeem,
  points,
  redeemingId,
  reward,
}: {
  onRedeem: () => void;
  points: number;
  redeemingId: string | null;
  reward: Reward;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const canRedeem = points >= reward.points_required && reward.stock > 0;

  return (
    <View
      style={{
        overflow: "hidden",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isDark ? "#314139" : "#dbe4df",
        backgroundColor: isDark ? "#17231f" : "#ffffff",
      }}
    >
      {reward.image_url ? (
        <Image source={reward.image_url} contentFit="cover" style={{ width: "100%", height: 130 }} />
      ) : null}
      <View style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <Text
            selectable
            style={{ flex: 1, color: isDark ? "#f3fbf6" : "#17231f", fontSize: 16, fontWeight: "900" }}
          >
            {reward.title}
          </Text>
          <Text selectable style={{ color: "#28734f", fontWeight: "900" }}>
            {reward.points_required} pts
          </Text>
        </View>
        {reward.description ? (
          <Text selectable numberOfLines={2} style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 13 }}>
            {reward.description}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={!canRedeem || redeemingId === reward.id}
          onPress={onRedeem}
          style={{
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: canRedeem ? "#28734f" : "#90a79b",
          }}
        >
          {redeemingId === reward.id ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontWeight: "900" }}>
              {reward.stock <= 0 ? "Agotada" : canRedeem ? "Canjear" : "Puntos insuficientes"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function RedemptionCard({ redemption }: { redemption: RewardRedemption }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isDark ? "#314139" : "#dbe4df",
        backgroundColor: isDark ? "#17231f" : "#ffffff",
        padding: 14,
        gap: 6,
      }}
    >
      <Text selectable style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 16, fontWeight: "900" }}>
        {redemption.title}
      </Text>
      <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 13 }}>
        {redemption.points_spent} puntos gastados
      </Text>
      <Text selectable style={{ color: "#28734f", fontSize: 12, fontWeight: "800" }}>
        {redemption.status}
      </Text>
    </View>
  );
}

function MessageCard({ danger, message }: { danger?: boolean; message: string }) {
  return (
    <View
      style={{
        borderRadius: 8,
        backgroundColor: danger ? "#fff0ee" : "#d7f8df",
        padding: 12,
      }}
    >
      <Text selectable style={{ color: danger ? "#8c1d18" : "#166534", fontWeight: "800" }}>
        {message}
      </Text>
    </View>
  );
}
