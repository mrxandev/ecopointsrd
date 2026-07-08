import { Image } from "expo-image";
import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
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
const VIEWS = ["Disponibles", "Inscritas", "Completadas"] as const;

export function MissionsScreen() {
  const { token } = useAuth();
  const isDark = false;
  const { width } = useWindowDimensions();
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

  const activeRegistrations = useMemo(
    () => registrations.filter((registration) => registration.status !== "CANCELLED"),
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
      style={{ flex: 1, backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 14 }}
    >
      <View style={{ gap: 12 }}>
        <Text
          selectable
          style={{
            color: isDark ? "#f3fbf6" : "#141b2b",
            fontSize: 24,
            fontWeight: "900",
          }}
        >
          Misiones
        </Text>
        <View style={{ borderBottomWidth: 1, borderBottomColor: "#d1d5db", flexDirection: "row" }}>
          {VIEWS.map((item) => {
            const isActive = item === view;

            return (
              <Pressable
                accessibilityRole="button"
                key={item}
                onPress={() => setView(item)}
                style={{
                  flex: 1,
                  minHeight: 34,
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? "#0f5238" : "transparent",
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#0f5238" : "#404943",
                    fontSize: 11,
                    fontWeight: "800",
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
                  backgroundColor: isActive ? "#2d6a4f" : isDark ? "#1b2823" : "#ffffff",
                  borderWidth: 1,
                  borderColor: isActive ? "#2d6a4f" : isDark ? "#314139" : "#d1d5db",
                  paddingHorizontal: 13,
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#ffffff" : isDark ? "#dce8e1" : "#404943",
                    fontSize: 11,
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
          <ActivityIndicator color="#2d6a4f" />
          <Text selectable style={{ color: isDark ? "#b8c7bf" : "#404943", fontSize: 14 }}>
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
            backgroundColor: isDark ? "#351d1b" : "#ffdad6",
            padding: 16,
            gap: 12,
          }}
        >
          <Text selectable style={{ color: isDark ? "#ffd9d6" : "#93000a", fontWeight: "700" }}>
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
              backgroundColor: "#2d6a4f",
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
              screenWidth={width}
            />
          ))
        : null}

      {!isLoading && !error && view !== "Disponibles"
        ? activeRegistrations
            .filter((registration) =>
              view === "Completadas"
                ? registration.status === "COMPLETED"
                : registration.status !== "COMPLETED",
            )
            .map((registration) => (
              <RegistrationCard key={registration.id} registration={registration} />
            ))
        : null}

      {!isLoading &&
      !error &&
      ((view === "Disponibles" && filteredMissions.length === 0) ||
        (view === "Inscritas" &&
          activeRegistrations.filter((registration) => registration.status !== "COMPLETED").length === 0) ||
        (view === "Completadas" &&
          activeRegistrations.filter((registration) => registration.status === "COMPLETED").length === 0)) ? (
        <View
          style={{
            minHeight: 220,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: isDark ? "#ffffff" : "#ffffff",
            padding: 20,
            gap: 8,
          }}
        >
          <Text selectable style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontWeight: "800" }}>
            {view === "Disponibles"
              ? "No hay misiones disponibles."
              : view === "Completadas"
                ? "Aun no tienes misiones completadas."
                : "Aun no te has inscrito."}
          </Text>
          <Text
            selectable
            style={{ color: isDark ? "#b8c7bf" : "#404943", fontSize: 13, textAlign: "center" }}
          >
            {view === "Inscritas"
              ? "Inscribete en una mision disponible para verla aqui."
              : "Vuelve a intentar mas tarde."}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function MissionCard({
  isRegistered,
  mission,
  screenWidth,
}: {
  isRegistered: boolean;
  mission: Mission;
  screenWidth: number;
}) {
  const isDark = false;
  const imageHeight = Math.min(170, Math.max(130, (screenWidth - 32) * 0.42));
  const availableSlots =
    mission.max_participants && typeof mission.registered_count === "number"
      ? Math.max(mission.max_participants - mission.registered_count, 0)
      : null;
  const participantProgress =
    mission.max_participants && typeof mission.registered_count === "number"
      ? Math.min(Math.max(mission.registered_count / mission.max_participants, 0), 1)
      : 0;

  return (
    <Link href={{ pathname: "/mission/[id]", params: { id: mission.id } }} asChild>
      <Pressable
        style={{
          overflow: "hidden",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#e1e8fd",
          backgroundColor: isDark ? "#ffffff" : "#ffffff",
          boxShadow: "0 2px 8px rgba(20, 27, 43, 0.08)",
        }}
      >
        <View style={{ minHeight: imageHeight }}>
          <Image
            source={getMissionImage(mission.id)}
            contentFit="cover"
            transition={180}
            style={{ height: imageHeight, width: "100%" }}
          />
          <View
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              borderRadius: 999,
              backgroundColor: isRegistered ? "#d4e3ff" : "#d8f3dc",
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: isRegistered ? "#0f4883" : "#0f5238", fontSize: 11, fontWeight: "900" }}>
              {isRegistered ? "Inscrito" : `+${mission.points_reward} pts`}
            </Text>
          </View>
        </View>

        <View style={{ padding: 12, gap: 9 }}>
          <View style={{ gap: 5 }}>
            <Text
              selectable
              numberOfLines={2}
              style={{
                color: isDark ? "#f3fbf6" : "#141b2b",
                fontSize: 14,
                fontWeight: "900",
                lineHeight: 18,
              }}
            >
              {mission.title}
            </Text>
            <Text
              selectable
              numberOfLines={2}
              style={{ color: isDark ? "#b8c7bf" : "#404943", fontSize: 12, lineHeight: 17 }}
            >
              {mission.description}
            </Text>
          </View>

          <Text
            selectable
            style={{ color: "#2d6a4f", fontSize: 11, fontWeight: "800" }}
            numberOfLines={1}
          >
            {getMissionLocation(mission)}
          </Text>

          <View style={{ gap: 5 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Text selectable style={{ color: "#2d6a4f", fontSize: 11, fontWeight: "800" }}>
                Participantes
              </Text>
              <Text selectable style={{ color: "#404943", fontSize: 11, fontWeight: "700" }}>
                {mission.max_participants && typeof mission.registered_count === "number"
                  ? `${mission.registered_count} de ${mission.max_participants}`
                  : "Abierta"}
              </Text>
            </View>
            <ProgressBar progress={participantProgress} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <CalendarIcon color="#404943" />
              <Text selectable numberOfLines={1} style={{ color: isDark ? "#c9d6cf" : "#404943", fontSize: 11 }}>
                {formatMissionDate(mission.start_date)}
                {availableSlots !== null ? ` · ${availableSlots} cupos` : ""}
              </Text>
            </View>
            <View
              style={{
                minHeight: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                backgroundColor: isRegistered ? "#075985" : "#0f5238",
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "900" }}>
                {isRegistered ? "Ver avance" : "Inscribirse"}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={{ height: 6, borderRadius: 999, backgroundColor: "#e9edff", overflow: "hidden" }}>
      <View
        style={{
          height: "100%",
          width: `${Math.round(progress * 100)}%`,
          borderRadius: 999,
          backgroundColor: "#52b788",
        }}
      />
    </View>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 13, height: 13 }}>
      <View
        style={{
          width: 12,
          height: 11,
          borderWidth: 1.2,
          borderColor: color,
          borderRadius: 2,
          marginTop: 2,
        }}
      />
      <View style={{ position: "absolute", top: 5, left: 1, right: 0, height: 1.2, backgroundColor: color }} />
      <View style={{ position: "absolute", top: 0, left: 3, width: 1.2, height: 4, backgroundColor: color }} />
      <View style={{ position: "absolute", top: 0, right: 3, width: 1.2, height: 4, backgroundColor: color }} />
    </View>
  );
}

function RegistrationCard({ registration }: { registration: MissionRegistration }) {
  const isDark = false;

  return (
    <Link href={{ pathname: "/mission/[id]", params: { id: registration.mission_id } }} asChild>
      <Pressable
        style={{
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#d1d5db",
          backgroundColor: isDark ? "#ffffff" : "#ffffff",
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
              color: isDark ? "#f3fbf6" : "#141b2b",
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
          style={{ color: isDark ? "#b8c7bf" : "#404943", fontSize: 13, lineHeight: 18 }}
        >
          {registration.description}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={{ color: "#2d6a4f", fontSize: 12, fontWeight: "800" }}>
            {registration.mission_type}
          </Text>
          <Text selectable style={{ color: isDark ? "#c9d6cf" : "#404943", fontSize: 12 }}>
            +{registration.points_reward} pts
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

