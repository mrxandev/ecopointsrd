import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyRedemptions,
  getRewards,
  redeemReward,
  type Reward,
  type RewardRedemption,
} from "@/services/reward-service";
import { getMyPoints } from "@/services/user-service";

const FALLBACK_REWARD_IMAGES = [
  "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=700&q=80",
];

export function RewardsScreen() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"catalog" | "redemptions">("catalog");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [points, setPoints] = useState(0);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [rewardToRedeem, setRewardToRedeem] = useState<Reward | null>(null);
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
        const [nextRewards, nextPoints, nextRedemptions] = await Promise.all([
          getRewards(),
          token ? getMyPoints(token) : Promise.resolve({ points: 0 }),
          token ? getMyRedemptions(token) : Promise.resolve([]),
        ]);
        setRewards(nextRewards);
        setPoints(nextPoints.points ?? 0);
        setRedemptions(nextRedemptions);
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

  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        void loadRewards();
      }, 0);

      return () => {
        clearTimeout(timeout);
      };
    }, [loadRewards])
  );

  const sortedRewards = useMemo(
    () => [...rewards].sort((a, b) => a.points_required - b.points_required),
    [rewards],
  );

  const filteredRewards = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return sortedRewards;
    }

    return sortedRewards.filter((reward) =>
      [reward.title, reward.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(cleanQuery),
    );
  }, [query, sortedRewards]);

  const filteredRedemptions = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const sorted = [...redemptions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (!cleanQuery) {
      return sorted;
    }

    return sorted.filter((redemption) =>
      [redemption.title]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(cleanQuery),
    );
  }, [query, redemptions]);

  const popularRewards = filteredRewards.slice(0, 5);

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
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadRewards("refresh")} />
        }
        style={{ flex: 1, backgroundColor: "#f7f7fb" }}
        contentContainerStyle={{ padding: 12, paddingBottom: 92, gap: 14 }}
      >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: "#0f6b4b", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "900" }}>E</Text>
          </View>
          <Text style={{ color: "#0b5f46", fontSize: 13, fontWeight: "900" }}>EcoPoints RD</Text>
        </View>
        <View
          style={{
            minHeight: 28,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            backgroundColor: "#d8f3dc",
            paddingHorizontal: 10,
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{ color: "#0f5238", fontSize: 11, fontWeight: "900" }}
          >
            {new Intl.NumberFormat("es-DO").format(points)} pts
          </Text>
        </View>
      </View>

      <View style={{ gap: 9 }}>
        <Text selectable style={{ color: "#0b5f46", fontSize: 25, fontWeight: "900" }}>
          Recompensas
        </Text>
        <View style={{ flexDirection: "row", backgroundColor: "#e6ece8", borderRadius: 8, padding: 4 }}>
          <Pressable
            onPress={() => setActiveTab("catalog")}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
              backgroundColor: activeTab === "catalog" ? "#ffffff" : "transparent",
              borderRadius: 6,
              boxShadow: activeTab === "catalog" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Text style={{ color: activeTab === "catalog" ? "#0b5f46" : "#607068", fontSize: 13, fontWeight: "800" }}>Catálogo</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("redemptions")}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
              backgroundColor: activeTab === "redemptions" ? "#ffffff" : "transparent",
              borderRadius: 6,
              boxShadow: activeTab === "redemptions" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Text style={{ color: activeTab === "redemptions" ? "#0b5f46" : "#607068", fontSize: 13, fontWeight: "800" }}>Mis Canjes</Text>
          </Pressable>
        </View>

        <View
          style={{
            minHeight: 46,
            alignItems: "center",
            borderRadius: 8,
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#9aa8a0",
            flexDirection: "row",
            paddingHorizontal: 12,
          }}
        >
          <SearchIcon />
          <TextInput
            autoCapitalize="words"
            onChangeText={setQuery}
            placeholder="Buscar recompensas..."
            placeholderTextColor="#9ca6a0"
            style={{ color: "#141b2b", flex: 1, fontSize: 13, minHeight: 44, marginLeft: 8 }}
            value={query}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color="#2d6a4f" />
          <Text selectable style={{ color: "#404943" }}>
            Cargando recompensas...
          </Text>
        </View>
      ) : null}

      {!isLoading && error ? <MessageCard message={error} danger /> : null}

      {!isLoading && message ? (
        <MessageCard
          message={message}
          danger={message.includes("No pudimos") || message.includes("insuficientes")}
        />
      ) : null}

      {!isLoading && !error && activeTab === "catalog" && popularRewards.length > 0 ? (
        <View style={{ gap: 9 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text selectable style={{ color: "#141b2b", fontSize: 15, fontWeight: "900" }}>
              Mas populares
            </Text>
            <Text selectable style={{ color: "#0f6b4b", fontSize: 10, fontWeight: "900" }}>
              Ver todas
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 12, paddingRight: 12 }}>
              {popularRewards.map((reward, index) => (
                <PopularRewardCard
                  key={reward.id}
                  index={index}
                  points={points}
                  redeemingId={redeemingId}
                  reward={reward}
                  onRedeem={() => setRewardToRedeem(reward)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      {!isLoading && !error && activeTab === "catalog" ? (
        <View style={{ gap: 10 }}>
          <Text selectable style={{ color: "#141b2b", fontSize: 15, fontWeight: "900" }}>
            Todas las opciones
          </Text>
          {filteredRewards.map((reward, index) => (
            <RewardOptionCard
              key={reward.id}
              index={index}
              points={points}
              redeemingId={redeemingId}
              reward={reward}
              onRedeem={() => setRewardToRedeem(reward)}
            />
          ))}
        </View>
      ) : null}

      {!isLoading && !error && activeTab === "redemptions" ? (
        <View style={{ gap: 10 }}>
          <Text selectable style={{ color: "#141b2b", fontSize: 15, fontWeight: "900" }}>
            Mis Canjes ({redemptions.length})
          </Text>
          {filteredRedemptions.map((redemption, index) => (
            <RedemptionCard key={redemption.id} index={index} redemption={redemption} />
          ))}
        </View>
      ) : null}

      {!isLoading && !error && ((activeTab === "catalog" && filteredRewards.length === 0) || (activeTab === "redemptions" && filteredRedemptions.length === 0)) ? (
        <View
          style={{
            minHeight: 190,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: "#ffffff",
            padding: 20,
          }}
        >
          <Text selectable style={{ color: "#141b2b", fontWeight: "900", textAlign: "center" }}>
            {activeTab === "catalog" 
              ? "No encontramos recompensas con ese buscador."
              : query ? "No encontramos canjes con ese buscador." : "Aún no has canjeado ninguna recompensa."}
          </Text>
        </View>
      ) : null}
      </ScrollView>
      <ConfirmationDialog
        confirmLabel="Canjear"
        message={
          rewardToRedeem
            ? `Vas a usar ${new Intl.NumberFormat("es-DO").format(
                rewardToRedeem.points_required,
              )} puntos para reclamar "${rewardToRedeem.title}".`
            : ""
        }
        onCancel={() => setRewardToRedeem(null)}
        onConfirm={() => {
          if (!rewardToRedeem) {
            return;
          }

          const nextReward = rewardToRedeem;
          setRewardToRedeem(null);
          void handleRedeem(nextReward);
        }}
        title="Confirmar canje"
        visible={!!rewardToRedeem}
      />
    </>
  );
}

function PopularRewardCard({
  index,
  onRedeem,
  points,
  redeemingId,
  reward,
}: {
  index: number;
  onRedeem: () => void;
  points: number;
  redeemingId: string | null;
  reward: Reward;
}) {
  const canRedeem = points >= reward.points_required && reward.stock > 0;

  return (
    <View
      style={{
        width: 218,
        overflow: "hidden",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#dce3df",
        backgroundColor: "#ffffff",
        boxShadow: "0 3px 10px rgba(20, 27, 43, 0.12)",
      }}
    >
      <View style={{ minHeight: 112 }}>
        <Image
          source={getRewardImage(reward, index)}
          contentFit="cover"
          transition={180}
          style={{ width: "100%", height: 112, backgroundColor: "#e6ece8" }}
        />
        <PointsBadge points={reward.points_required} top={8} />
      </View>
      <View style={{ padding: 11, gap: 7 }}>
        <Text selectable numberOfLines={1} style={{ color: "#607068", fontSize: 10, fontWeight: "700" }}>
          {getRewardCategory(reward)}
        </Text>
        <Text selectable numberOfLines={2} style={{ color: "#141b2b", fontSize: 13, fontWeight: "900", lineHeight: 17 }}>
          {reward.title}
        </Text>
        <StockText stock={reward.stock} />
        <RedeemButton
          canRedeem={canRedeem}
          isRedeeming={redeemingId === reward.id}
          reward={reward}
          onRedeem={onRedeem}
          solid
        />
      </View>
    </View>
  );
}

function RewardOptionCard({
  index,
  onRedeem,
  points,
  redeemingId,
  reward,
}: {
  index: number;
  onRedeem: () => void;
  points: number;
  redeemingId: string | null;
  reward: Reward;
}) {
  const canRedeem = points >= reward.points_required && reward.stock > 0;

  return (
    <View
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e0e7e3",
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 8px rgba(20, 27, 43, 0.07)",
        padding: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <CategoryIcon index={index} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text selectable numberOfLines={1} style={{ color: "#607068", fontSize: 10 }}>
              {getRewardCategory(reward)}
            </Text>
            <Text selectable numberOfLines={2} style={{ color: "#141b2b", fontSize: 13, fontWeight: "900", lineHeight: 17 }}>
              {reward.title}
            </Text>
            <StockText stock={reward.stock} />
          </View>
        </View>
        <PointsBadge points={reward.points_required} />
      </View>
      <RedeemButton
        canRedeem={canRedeem}
        isRedeeming={redeemingId === reward.id}
        reward={reward}
        onRedeem={onRedeem}
      />
    </View>
  );
}

function StockText({ stock }: { stock: number }) {
  return (
    <Text
      selectable
      numberOfLines={1}
      style={{ color: stock > 0 ? "#607068" : "#93000a", fontSize: 10, fontWeight: "800" }}
    >
      {stock > 0 ? `${stock} disponibles` : "Sin stock"}
    </Text>
  );
}

function RedeemButton({
  canRedeem,
  isRedeeming,
  onRedeem,
  reward,
  solid,
}: {
  canRedeem: boolean;
  isRedeeming: boolean;
  onRedeem: () => void;
  reward: Reward;
  solid?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!canRedeem || isRedeeming}
      onPress={onRedeem}
      style={{
        minHeight: solid ? 39 : 34,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 7,
        borderWidth: solid ? 0 : 1,
        borderColor: canRedeem ? "#0f5238" : "#90a79b",
        backgroundColor: solid ? (canRedeem ? "#0f5238" : "#90a79b") : "#ffffff",
      }}
    >
      {isRedeeming ? (
        <ActivityIndicator color={solid ? "#ffffff" : "#0f5238"} />
      ) : (
        <Text
          style={{
            color: solid ? "#ffffff" : canRedeem ? "#0f5238" : "#607068",
            fontSize: 11,
            fontWeight: "900",
          }}
        >
          {reward.stock <= 0 ? "Agotada" : canRedeem ? "Canjear" : "Puntos insuficientes"}
        </Text>
      )}
    </Pressable>
  );
}

function PointsBadge({ points, top }: { points: number; top?: number }) {
  return (
    <View
      style={{
        position: top === undefined ? "relative" : "absolute",
        right: top === undefined ? undefined : 8,
        top,
        alignSelf: "flex-start",
        borderRadius: 5,
        backgroundColor: "#d8f3dc",
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text style={{ color: "#166534", fontSize: 10, fontWeight: "900" }}>
        {new Intl.NumberFormat("es-DO").format(points)} pts
      </Text>
    </View>
  );
}

function CategoryIcon({ index }: { index: number }) {
  const colors = ["#dceafe", "#e7efff", "#edf1f7", "#f0f8ed"];

  return (
    <View
      style={{
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        backgroundColor: colors[index % colors.length],
      }}
    >
      <View
        style={{
          width: 16,
          height: 14,
          borderRadius: 3,
          borderWidth: 1.4,
          borderColor: "#4c6785",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 10,
          width: 9,
          height: 5,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          borderWidth: 1.4,
          borderBottomWidth: 0,
          borderColor: "#4c6785",
        }}
      />
    </View>
  );
}

function SearchIcon() {
  return (
    <View style={{ width: 16, height: 16 }}>
      <View
        style={{
          width: 11,
          height: 11,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: "#6d7b74",
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 1,
          bottom: 1,
          width: 6,
          height: 1.5,
          backgroundColor: "#6d7b74",
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

function MessageCard({ danger, message }: { danger?: boolean; message: string }) {
  return (
    <View
      style={{
        borderRadius: 8,
        backgroundColor: danger ? "#ffdad6" : "#d8f3dc",
        padding: 12,
      }}
    >
      <Text selectable style={{ color: danger ? "#93000a" : "#166534", fontWeight: "800" }}>
        {message}
      </Text>
    </View>
  );
}

function getRewardImage(reward: Reward, index: number) {
  return reward.image_url || FALLBACK_REWARD_IMAGES[index % FALLBACK_REWARD_IMAGES.length];
}

function getRewardCategory(reward: Reward) {
  const text = `${reward.title} ${reward.description ?? ""}`.toLowerCase();

  if (text.includes("supermercado") || text.includes("mercado")) {
    return "Supermercados";
  }

  if (text.includes("metro") || text.includes("transporte") || text.includes("recarga")) {
    return "Transporte";
  }

  if (text.includes("libro") || text.includes("educacion") || text.includes("libreria")) {
    return "Educacion";
  }

  return "Recompensa";
}

function RedemptionCard({
  index,
  redemption,
}: {
  index: number;
  redemption: RewardRedemption;
}) {
  const date = new Date(redemption.created_at);
  const formattedDate = new Intl.DateTimeFormat("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

  return (
    <View
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e0e7e3",
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 8px rgba(20, 27, 43, 0.07)",
        padding: 14,
        gap: 10,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <CategoryIcon index={index} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text selectable numberOfLines={1} style={{ color: "#607068", fontSize: 10, textTransform: "uppercase" }}>
          {redemption.status === "completed" ? "Completado" : redemption.status === "pending" ? "Pendiente" : redemption.status} • {formattedDate}
        </Text>
        <Text selectable numberOfLines={2} style={{ color: "#141b2b", fontSize: 13, fontWeight: "900", lineHeight: 17 }}>
          {redemption.title}
        </Text>
      </View>
      <PointsBadge points={redemption.points_spent} />
    </View>
  );
}
