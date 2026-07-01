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
import {
  getMyMissionRegistrations,
  getPublishedMissions,
  type Mission,
  type MissionRegistration,
} from "@/services/mission-service";

const FILTERS = ["Todas", "Esta semana", "Mayor puntuacion"] as const;
const VIEWS = ["Disponibles", "Mis misiones"] as const;

export function MissionsScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [view, setView] = useState<(typeof VIEWS)[number]>("Disponibles");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [registrations, setRegistrations] = useState<MissionRegistration[]>([]);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("Todas");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMissions = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        setError(null);
        const [nextMissions, nextRegistrations] = await Promise.all([
          getPublishedMissions(),
          token ? getMyMissionRegistrations(token) : Promise.resolve([]),
        ]);
        setMissions(nextMissions);
        setRegistrations(nextRegistrations);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar las misiones disponibles.",
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
      void loadMissions();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadMissions]);

  const registeredMissionIds = useMemo(
    () =>
      new Set(
        registrations
          .filter((registration) => registration.status !== "CANCELLED")
          .map((registration) => registration.mission_id),
      ),
    [registrations],
  );

  const filteredMissions = useMemo(() => {
    const nextMissions = [...missions];

    if (activeFilter === "Mayor puntuacion") {
      return nextMissions.sort((a, b) => b.points_reward - a.points_reward);
    }

    if (activeFilter === "Esta semana") {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      return nextMissions.filter((mission) => {
        if (!mission.start_date) {
          return true;
        }

        const startDate = new Date(mission.start_date);

        return startDate >= today && startDate <= nextWeek;
      });
    }

    return nextMissions;
  }, [activeFilter, missions]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadMissions("refresh")} />
      }
      style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f4f7f3" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 16 }}
    >
      <View style={{ gap: 4 }}>
        <Text
          selectable
          style={{
            color: isDark ? "#f3fbf6" : "#17231f",
            fontSize: 28,
            fontWeight: "800",
          }}
        >
          Misiones
        </Text>
        <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 14 }}>
          Explora actividades ambientales, inscribete y da seguimiento a tu avance.
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

      {view === "Disponibles" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {FILTERS.map((filter) => {
            const isActive = filter === activeFilter;

            return (
              <Pressable
                accessibilityRole="button"
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={{
                  minHeight: 34,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  backgroundColor: isActive ? "#28734f" : isDark ? "#1b2823" : "#ffffff",
                  borderWidth: 1,
                  borderColor: isActive ? "#28734f" : isDark ? "#314139" : "#dbe4df",
                  paddingHorizontal: 12,
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#ffffff" : isDark ? "#dce8e1" : "#34483e",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {isLoading ? (
        <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color="#28734f" />
          <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 14 }}>
            Cargando misiones...
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
            onPress={() => void loadMissions()}
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

      {!isLoading && !error && view === "Disponibles"
        ? filteredMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isRegistered={registeredMissionIds.has(mission.id)}
            />
          ))
        : null}

      {!isLoading && !error && view === "Mis misiones"
        ? registrations
            .filter((registration) => registration.status !== "CANCELLED")
            .map((registration) => (
              <RegistrationCard key={registration.id} registration={registration} />
            ))
        : null}

      {!isLoading &&
      !error &&
      ((view === "Disponibles" && filteredMissions.length === 0) ||
        (view === "Mis misiones" &&
          registrations.filter((registration) => registration.status !== "CANCELLED").length === 0)) ? (
        <View
          style={{
            minHeight: 220,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: isDark ? "#17231f" : "#ffffff",
            padding: 20,
            gap: 8,
          }}
        >
          <Text selectable style={{ color: isDark ? "#f3fbf6" : "#17231f", fontWeight: "800" }}>
            {view === "Disponibles" ? "No hay misiones disponibles." : "Aun no te has inscrito."}
          </Text>
          <Text
            selectable
            style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 13, textAlign: "center" }}
          >
            {view === "Mis misiones"
              ? "Inscribete en una mision disponible para verla aqui."
              : "Vuelve a intentar mas tarde."}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function MissionCard({ isRegistered, mission }: { isRegistered: boolean; mission: Mission }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const availableSlots =
    mission.max_participants && typeof mission.registered_count === "number"
      ? Math.max(mission.max_participants - mission.registered_count, 0)
      : null;

  return (
    <Link href={{ pathname: "/mission/[id]", params: { id: mission.id } }} asChild>
      <Pressable
        style={{
          overflow: "hidden",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#dbe4df",
          backgroundColor: isDark ? "#17231f" : "#ffffff",
        }}
      >
        <View style={{ minHeight: 150 }}>
          <Image
            source={getMissionImage(mission.id)}
            contentFit="cover"
            transition={180}
            style={{ height: 150, width: "100%" }}
          />
          <View
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              borderRadius: 999,
              backgroundColor: isRegistered ? "#e0f2fe" : "#dcfce7",
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: isRegistered ? "#075985" : "#166534", fontSize: 12, fontWeight: "900" }}>
              {isRegistered ? "Inscrito" : `+${mission.points_reward} pts`}
            </Text>
          </View>
        </View>

        <View style={{ padding: 14, gap: 10 }}>
          <View style={{ gap: 4 }}>
            <Text
              selectable
              numberOfLines={2}
              style={{
                color: isDark ? "#f3fbf6" : "#17231f",
                fontSize: 16,
                fontWeight: "900",
                lineHeight: 20,
              }}
            >
              {mission.title}
            </Text>
            <Text
              selectable
              numberOfLines={2}
              style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 13, lineHeight: 18 }}
            >
              {mission.description}
            </Text>
          </View>

          <Text
            selectable
            style={{ color: "#28734f", fontSize: 12, fontWeight: "800" }}
            numberOfLines={1}
          >
            {getMissionLocation(mission)}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ gap: 2 }}>
              <Text selectable style={{ color: isDark ? "#c9d6cf" : "#4d6258", fontSize: 12 }}>
                {formatMissionDate(mission.start_date)}
              </Text>
              {availableSlots !== null ? (
                <Text selectable style={{ color: isDark ? "#9fb0a7" : "#63786e", fontSize: 11 }}>
                  {availableSlots} cupos disponibles
                </Text>
              ) : null}
            </View>
            <View
              style={{
                minHeight: 34,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: isRegistered ? "#075985" : "#0f5f43",
                paddingHorizontal: 14,
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "900" }}>
                {isRegistered ? "Ver avance" : "Inscribirme"}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function RegistrationCard({ registration }: { registration: MissionRegistration }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Link href={{ pathname: "/mission/[id]", params: { id: registration.mission_id } }} asChild>
      <Pressable
        style={{
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#dbe4df",
          backgroundColor: isDark ? "#17231f" : "#ffffff",
          padding: 14,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <Text
            selectable
            numberOfLines={2}
            style={{
              flex: 1,
              color: isDark ? "#f3fbf6" : "#17231f",
              fontSize: 16,
              fontWeight: "900",
              lineHeight: 20,
            }}
          >
            {registration.title}
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              borderRadius: 999,
              backgroundColor: registration.status === "COMPLETED" ? "#dcfce7" : "#e0f2fe",
              paddingHorizontal: 9,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                color: registration.status === "COMPLETED" ? "#166534" : "#075985",
                fontSize: 11,
                fontWeight: "900",
              }}
            >
              {registration.status === "COMPLETED" ? "Completada" : "Inscrita"}
            </Text>
          </View>
        </View>
        <Text
          selectable
          numberOfLines={2}
          style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 13, lineHeight: 18 }}
        >
          {registration.description}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={{ color: "#28734f", fontSize: 12, fontWeight: "800" }}>
            {registration.mission_type}
          </Text>
          <Text selectable style={{ color: isDark ? "#c9d6cf" : "#4d6258", fontSize: 12 }}>
            +{registration.points_reward} pts
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
