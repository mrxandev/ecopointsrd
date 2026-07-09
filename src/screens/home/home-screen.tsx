import { Image } from "expo-image";
import { Link } from "expo-router";
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

import { useAuth } from "@/hooks/use-auth";
import {
  formatMissionDate,
  getMissionImage,
  getMissionLocation,
} from "@/screens/missions/mission-ui";
import { getPublishedMissions, type Mission } from "@/services/mission-service";
import { getMyProfile, type UserProfile } from "@/services/user-service";

const LEVELS = [
  { name: "Semilla Verde", threshold: 0 },
  { name: "Guardian Verde", threshold: 500 },
  { name: "Defensor Ambiental", threshold: 2000 },
  { name: "Heroe Ecologico", threshold: 5000 },
] as const;

function getLevelProgress(points: number) {
  let currentIndex = 0;

  for (let index = 0; index < LEVELS.length; index += 1) {
    if (points >= LEVELS[index].threshold) {
      currentIndex = index;
    }
  }

  const current = LEVELS[currentIndex];
  const next = LEVELS[currentIndex + 1];

  if (!next) {
    return { current, next: null, progress: 1, pointsToNext: 0 };
  }

  const span = next.threshold - current.threshold;
  const progress = Math.min(1, Math.max(0, (points - current.threshold) / span));

  return {
    current,
    next,
    progress,
    pointsToNext: Math.max(0, next.threshold - points),
  };
}

function getGreetingName(profile: UserProfile | null, fallbackEmail?: string) {
  if (profile?.first_name) {
    return profile.first_name;
  }

  return fallbackEmail?.split("@")[0] ?? "recicladora";
}

export function HomeScreen() {
  const { token, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHome = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        setError(null);
        const [nextProfile, nextMissions] = await Promise.all([
          token ? getMyProfile(token) : Promise.resolve(null),
          getPublishedMissions(),
        ]);
        setProfile(nextProfile);
        setMissions(nextMissions);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "No pudimos cargar tu inicio.",
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
      void loadHome();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadHome]);

  const points = profile?.points ?? 0;
  const levelInfo = useMemo(() => getLevelProgress(points), [points]);

  const recommendedMissions = useMemo(
    () => [...missions].sort((a, b) => b.points_reward - a.points_reward).slice(0, 4),
    [missions],
  );

  const upcomingMissions = useMemo(
    () =>
      [...missions]
        .filter((mission) => Boolean(mission.start_date))
        .sort(
          (a, b) => new Date(a.start_date ?? 0).getTime() - new Date(b.start_date ?? 0).getTime(),
        )
        .slice(0, 3),
    [missions],
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadHome("refresh")} />
      }
      style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f4f7f3" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 16 }}
    >
      <View style={{ gap: 4 }}>
        <Text
          selectable
          style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 24, fontWeight: "900" }}
        >
          Buenos dias, {getGreetingName(profile, user?.email)} 👋
        </Text>
        <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 14 }}>
          Lista para hacer la diferencia hoy.
        </Text>
      </View>

      {isLoading ? (
        <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color="#28734f" />
          <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 14 }}>
            Cargando tu inicio...
          </Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View
          style={{
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#f2b8b5",
            backgroundColor: isDark ? "#351d1b" : "#fff0ee",
            padding: 16,
            gap: 12,
          }}
        >
          <Text selectable style={{ color: isDark ? "#ffd9d6" : "#8c1d18", fontWeight: "700" }}>
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadHome()}
            style={{
              minHeight: 42,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: "#28734f",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && !error ? (
        <>
          <LevelCard levelInfo={levelInfo} points={points} />

          <QuickActions />

          <View style={{ gap: 10 }}>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 18, fontWeight: "900" }}
            >
              Tu Impacto
            </Text>
            <ImpactStats profile={profile} />
          </View>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text
                selectable
                style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 18, fontWeight: "900" }}
              >
                Misiones Recomendadas
              </Text>
              <Link href="/(tabs)/misiones" asChild>
                <Pressable accessibilityRole="button">
                  <Text style={{ color: "#28734f", fontSize: 13, fontWeight: "800" }}>Ver todas</Text>
                </Pressable>
              </Link>
            </View>

            {recommendedMissions.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {recommendedMissions.map((mission) => (
                  <RecommendedMissionCard key={mission.id} mission={mission} />
                ))}
              </ScrollView>
            ) : (
              <EmptyStateCard message="No hay misiones recomendadas por ahora." />
            )}
          </View>

          <View style={{ gap: 10 }}>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 18, fontWeight: "900" }}
            >
              Proximas Actividades
            </Text>

            {upcomingMissions.length > 0 ? (
              <View style={{ gap: 10 }}>
                {upcomingMissions.map((mission) => (
                  <UpcomingMissionRow key={mission.id} mission={mission} />
                ))}
              </View>
            ) : (
              <EmptyStateCard message="No hay actividades programadas por ahora." />
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function LevelCard({
  levelInfo,
  points,
}: {
  levelInfo: ReturnType<typeof getLevelProgress>;
  points: number;
}) {
  return (
    <View
      style={{
        borderRadius: 14,
        backgroundColor: "#1b5c3f",
        padding: 18,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={{ fontSize: 14 }}>🛡️</Text>
        <Text style={{ color: "#bfe8d2", fontSize: 12, fontWeight: "800", letterSpacing: 0.4 }}>
          NIVEL ACTUAL
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "900" }}>
          {levelInfo.current.name}
        </Text>
        <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "900" }}>
          {new Intl.NumberFormat("es-DO").format(points)}
          <Text style={{ fontSize: 12, fontWeight: "700" }}> pts totales</Text>
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <View
          style={{
            height: 8,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.2)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${Math.round(levelInfo.progress * 100)}%`,
              borderRadius: 999,
              backgroundColor: "#7ee2a8",
            }}
          />
        </View>
        <Text style={{ color: "#d7f2e1", fontSize: 12, fontWeight: "600" }}>
          {levelInfo.next
            ? `Progreso al siguiente nivel: ${Math.round(levelInfo.progress * 100)}% - Faltan ${new Intl.NumberFormat("es-DO").format(levelInfo.pointsToNext)} pts para "${levelInfo.next.name}"`
            : "Alcanzaste el nivel maximo"}
        </Text>
      </View>
    </View>
  );
}

function QuickActions() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const actions = [
    { label: "Subir evidencia", emoji: "📤", href: "/(tabs)/misiones" as const, tint: "#28734f" },
    { label: "Ver mapa", emoji: "🗺️", href: "/(tabs)/mapa" as const, tint: "#1d6fa5" },
    { label: "Reciclar ahora", emoji: "♻️", href: "/(tabs)/mapa" as const, tint: "#28734f" },
    { label: "Canjear Recompensas", emoji: "🎁", href: "/(tabs)/recompensas" as const, tint: "#c07a1f" },
  ];

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {actions.map((action) => (
        <Link key={action.label} href={action.href} asChild>
          <Pressable
            accessibilityRole="button"
            style={{
              flexBasis: "23%",
              flexGrow: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: isDark ? "#314139" : "#dbe4df",
              backgroundColor: isDark ? "#17231f" : "#ffffff",
              paddingVertical: 14,
              paddingHorizontal: 6,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${action.tint}1f`,
              }}
            >
              <Text style={{ fontSize: 18 }}>{action.emoji}</Text>
            </View>
            <Text
              numberOfLines={2}
              style={{
                color: isDark ? "#dce8e1" : "#34483e",
                fontSize: 11,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {action.label}
            </Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

function ImpactStats({ profile }: { profile: UserProfile | null }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const stats = [
    { label: "Misiones completadas", value: profile?.completed_missions ?? 0, emoji: "🌱" },
    { label: "Puntos acumulados", value: profile?.total_points_earned ?? 0, emoji: "📈" },
    { label: "Puntos disponibles", value: profile?.points ?? 0, emoji: "⭐" },
  ];

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={{
            flexBasis: "31%",
            flexGrow: 1,
            gap: 6,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? "#314139" : "#dbe4df",
            backgroundColor: isDark ? "#17231f" : "#ffffff",
            padding: 12,
          }}
        >
          <Text style={{ fontSize: 16 }}>{stat.emoji}</Text>
          <Text style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 16, fontWeight: "900" }}>
            {new Intl.NumberFormat("es-DO").format(stat.value)}
          </Text>
          <Text style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 11 }} numberOfLines={2}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function RecommendedMissionCard({ mission }: { mission: Mission }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Link href={{ pathname: "/mission/[id]", params: { id: mission.id } }} asChild>
      <Pressable
        style={{
          width: 200,
          overflow: "hidden",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#dbe4df",
          backgroundColor: isDark ? "#17231f" : "#ffffff",
        }}
      >
        <View>
          <Image
            source={getMissionImage(mission.id)}
            contentFit="cover"
            transition={180}
            style={{ height: 100, width: "100%" }}
          />
          <View
            style={{
              position: "absolute",
              right: 8,
              top: 8,
              borderRadius: 999,
              backgroundColor: "#dcfce7",
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: "#166534", fontSize: 11, fontWeight: "900" }}>
              +{mission.points_reward} pts
            </Text>
          </View>
        </View>

        <View style={{ padding: 10, gap: 6 }}>
          <Text
            selectable
            numberOfLines={1}
            style={{ color: "#28734f", fontSize: 11, fontWeight: "800" }}
          >
            {getMissionLocation(mission)}
          </Text>
          <Text
            selectable
            numberOfLines={2}
            style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 13, fontWeight: "900", lineHeight: 17 }}
          >
            {mission.title}
          </Text>
          <View
            style={{
              marginTop: 2,
              minHeight: 32,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: "#0f5f43",
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "900" }}>Unirse a la mision</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function UpcomingMissionRow({ mission }: { mission: Mission }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const date = mission.start_date ? new Date(mission.start_date) : null;

  return (
    <Link href={{ pathname: "/mission/[id]", params: { id: mission.id } }} asChild>
      <Pressable
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#dbe4df",
          backgroundColor: isDark ? "#17231f" : "#ffffff",
          padding: 12,
        }}
      >
        <View
          style={{
            width: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: isDark ? "#1b2823" : "#eef4f0",
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: isDark ? "#dce8e1" : "#34483e", fontSize: 10, fontWeight: "800" }}>
            {date ? new Intl.DateTimeFormat("es-DO", { month: "short" }).format(date).toUpperCase() : "---"}
          </Text>
          <Text style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 16, fontWeight: "900" }}>
            {date ? date.getDate() : "-"}
          </Text>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            selectable
            numberOfLines={1}
            style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 14, fontWeight: "800" }}
          >
            {mission.title}
          </Text>
          <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 12 }}>
            {formatMissionDate(mission.start_date)}
            {typeof mission.registered_count === "number"
              ? ` · ${mission.registered_count} inscritos`
              : ""}
          </Text>
        </View>

        <Text style={{ color: isDark ? "#9fb0a7" : "#63786e", fontSize: 16 }}>›</Text>
      </Pressable>
    </Link>
  );
}

function EmptyStateCard({ message }: { message: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        borderRadius: 10,
        borderWidth: 1,
        borderColor: isDark ? "#314139" : "#dbe4df",
        backgroundColor: isDark ? "#17231f" : "#ffffff",
        padding: 16,
        alignItems: "center",
      }}
    >
      <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 13 }}>
        {message}
      </Text>
    </View>
  );
}
