import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";

import { useAuth } from "@/hooks/use-auth";
import { getUserRanking, type RankingUser } from "@/services/user-service";

const palette = {
  background: "#f9f9ff",
  surface: "#ffffff",
  surfaceLow: "#f1f3ff",
  podiumBlue: "#dfe6ff",
  podiumGreen: "#2d6a4f",
  highlight: "#d8f3dc",
  text: "#141b2b",
  textMuted: "#404943",
  primary: "#2d6a4f",
  primaryDark: "#0f5238",
  error: "#ba1a1a",
  errorSoft: "#ffdad6",
  outline: "#e7ebfb",
};

export function RankingScreen() {
  const { logout, token, user } = useAuth();
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadRanking = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        setError(null);
        const data = await getUserRanking(token);
        setRanking(data.users);
        setCurrentUserRank(data.currentUserRank);
      } catch (rankingError) {
        setError(rankingError instanceof Error ? rankingError : new Error("No pudimos cargar el ranking."));
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
        void loadRanking();
      }, 0);

      return () => {
        clearTimeout(timeout);
      };
    }, [loadRanking])
  );

  const sortedRanking = useMemo(() => [...ranking].sort((a, b) => a.rank - b.rank), [ranking]);
  const podium = sortedRanking.slice(0, 3);
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);
  const currentUser = sortedRanking.find((rankingUser) => rankingUser.id === user?.id);
  const visibleRows = sortedRanking.filter((rankingUser) => rankingUser.rank > 3);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadRanking("refresh")} />
      }
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 14 }}
    >
      {isLoading ? (
        <View style={{ minHeight: 360, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color={palette.primary} />
          <Text selectable style={{ color: palette.textMuted }}>
            Cargando ranking...
          </Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <StateCard
          title={error.message}
          actionLabel={error.name === "401" || error.name === "403" ? "Iniciar sesion otra vez" : "Reintentar"}
          onAction={() =>
            error.name === "401" || error.name === "403" ? void logout() : void loadRanking()
          }
        />
      ) : null}

      {!isLoading && !error ? (
        <>
          {podiumOrder.length ? (
            <View
              style={{
                minHeight: 174,
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 8,
                paddingTop: 4,
              }}
            >
              {podiumOrder.map((rankingUser) => (
                <PodiumCard
                  key={rankingUser.id}
                  rankingUser={rankingUser}
                  isCurrentUser={rankingUser.id === user?.id}
                />
              ))}
            </View>
          ) : null}

          {currentUser ? (
            <CurrentUserCard rankingUser={currentUser} />
          ) : currentUserRank ? (
            <View
              style={{
                borderRadius: 8,
                backgroundColor: palette.highlight,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: "#b7e4c7",
              }}
            >
              <Text style={{ color: palette.primaryDark, fontSize: 15, fontWeight: "900" }}>Tu posicion</Text>
              <Text style={{ color: palette.primary, fontSize: 16, fontWeight: "900" }}>#{formatNumber(currentUserRank)}</Text>
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            {visibleRows.map((rankingUser) => (
              <RankingRow
                key={rankingUser.id}
                rankingUser={rankingUser}
                isCurrentUser={rankingUser.id === user?.id}
              />
            ))}
          </View>

          {!sortedRanking.length ? (
            <View style={{ borderRadius: 8, backgroundColor: palette.surface, padding: 18 }}>
              <Text selectable style={{ color: palette.text, textAlign: "center", fontWeight: "800" }}>
                Todavia no hay usuarios en el ranking.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

function PodiumCard({
  isCurrentUser,
  rankingUser,
}: {
  isCurrentUser: boolean;
  rankingUser: RankingUser;
}) {
  const isFirst = rankingUser.rank === 1;
  const height = isFirst ? 96 : rankingUser.rank === 2 ? 76 : 64;
  const backgroundColor = isFirst ? palette.podiumGreen : palette.podiumBlue;
  const textColor = isFirst ? "#ffffff" : palette.text;

  return (
    <View style={{ flex: isFirst ? 1.12 : 1, alignItems: "center", gap: 6 }}>
      <View style={{ minHeight: isFirst ? 68 : 54, justifyContent: "flex-end", alignItems: "center" }}>
        <Medal rank={rankingUser.rank} />
        <Avatar rankingUser={rankingUser} size={isFirst ? 58 : 46} emphasized={isFirst} />
      </View>
      <View
        style={{
          width: "100%",
          height,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          backgroundColor,
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingHorizontal: 4,
        }}
      >
        <Text style={{ color: textColor, fontSize: 18, fontWeight: "900" }}>{rankingUser.rank}</Text>
        <Text numberOfLines={1} style={{ color: textColor, fontSize: 11, fontWeight: "800" }}>
          {formatNumber(rankingUser.points)} pts
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={{
          color: isCurrentUser ? palette.primary : palette.text,
          fontSize: 11,
          fontWeight: "800",
          maxWidth: "100%",
        }}
      >
        {getShortName(rankingUser)}
      </Text>
    </View>
  );
}

function CurrentUserCard({ rankingUser }: { rankingUser: RankingUser }) {
  return (
    <View
      style={{
        borderRadius: 8,
        backgroundColor: palette.highlight,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#b7e4c7",
        gap: 12,
      }}
    >
      <Text style={{ color: palette.primaryDark, fontSize: 15, fontWeight: "900" }}>{rankingUser.rank}</Text>
      <Avatar rankingUser={rankingUser} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.text, fontSize: 14, fontWeight: "900" }}>
          {getFullName(rankingUser)} (Tu)
        </Text>
        <Text style={{ color: palette.textMuted, fontSize: 11 }}>{formatNumber(rankingUser.points)} pts</Text>
      </View>
      <RankChange previousRank={rankingUser.previous_rank} rank={rankingUser.rank} />
    </View>
  );
}

function RankingRow({
  isCurrentUser,
  rankingUser,
}: {
  isCurrentUser: boolean;
  rankingUser: RankingUser;
}) {
  return (
    <View
      style={{
        minHeight: 58,
        borderRadius: 8,
        backgroundColor: isCurrentUser ? palette.highlight : palette.surface,
        borderWidth: 1,
        borderColor: isCurrentUser ? "#b7e4c7" : palette.outline,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text style={{ width: 20, color: palette.textMuted, fontSize: 11, fontWeight: "800" }}>{rankingUser.rank}</Text>
      <Avatar rankingUser={rankingUser} size={34} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: palette.text, fontSize: 13, fontWeight: "800" }}>
          {getFullName(rankingUser)}
          {isCurrentUser ? " (Tu)" : ""}
        </Text>
        <Text style={{ color: palette.textMuted, fontSize: 10 }}>{formatNumber(rankingUser.points)} pts</Text>
      </View>
      <RankChange previousRank={rankingUser.previous_rank} rank={rankingUser.rank} />
    </View>
  );
}

function Avatar({
  emphasized,
  rankingUser,
  size,
}: {
  emphasized?: boolean;
  rankingUser: RankingUser;
  size: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        borderWidth: emphasized ? 3 : 1,
        borderColor: emphasized ? "#f2994a" : "#c8d5ce",
        backgroundColor: palette.surfaceLow,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {rankingUser.profile_image ? (
        <Image source={rankingUser.profile_image} contentFit="cover" style={{ width: "100%", height: "100%" }} />
      ) : (
        <Text style={{ color: palette.primary, fontSize: Math.max(12, size * 0.36), fontWeight: "900" }}>
          {getFullName(rankingUser).slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function Medal({ rank }: { rank: number }) {
  const color = rank === 1 ? "#f4b400" : rank === 2 ? "#b7bdc8" : "#a76128";

  return (
    <View
      style={{
        position: "absolute",
        right: -2,
        top: 0,
        width: 16,
        height: 16,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color,
        borderWidth: 1,
        borderColor: "#ffffff",
        zIndex: 1,
      }}
    >
      <Text style={{ color: "#ffffff", fontSize: 9, fontWeight: "900" }}>{rank}</Text>
    </View>
  );
}

function RankChange({ previousRank, rank }: { previousRank?: number | null; rank: number }) {
  if (!previousRank || previousRank === rank) {
    return <Text style={{ color: palette.textMuted, fontSize: 13, fontWeight: "900" }}>-</Text>;
  }

  const delta = previousRank - rank;
  const isUp = delta > 0;

  return (
    <Text style={{ color: isUp ? palette.primary : palette.error, fontSize: 11, fontWeight: "900" }}>
      {isUp ? "↑" : "↓"} {Math.abs(delta)}
    </Text>
  );
}

function StateCard({
  actionLabel,
  onAction,
  title,
}: {
  actionLabel: string;
  onAction: () => void;
  title: string;
}) {
  return (
    <View style={{ borderRadius: 8, backgroundColor: palette.errorSoft, padding: 16, gap: 12 }}>
      <Text selectable style={{ color: palette.error, fontWeight: "800" }}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        style={{
          minHeight: 42,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          backgroundColor: palette.primary,
        }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "900" }}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function getFullName(user: Pick<RankingUser, "first_name" | "last_name" | "email">) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();

  return fullName || user.email || "Usuario";
}

function getShortName(user: Pick<RankingUser, "first_name" | "last_name" | "email">) {
  return user.first_name || getFullName(user).split(" ")[0] || "Usuario";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-DO").format(value);
}
