import { Image } from "expo-image";
import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  formatMissionDate,
  getMissionImage,
  getMissionLocation,
} from "@/screens/missions/mission-ui";
import {
  getPublishedMissions,
  type Mission,
} from "@/services/mission-service";
import { getRecyclingCenters, type RecyclingCenter } from "@/services/recycling-service";
import {
  CentersMap,
  type CentersMapRef,
  type MapActivity as MapMarkerActivity,
} from "../../components/recycling/centers-map";
import { getCenterLocation } from "./recycling-utils";

type ActivityKind = "all" | "mission" | "center";

type NearbyActivity =
  | {
      id: string;
      kind: "center";
      center: RecyclingCenter;
      latitude: number | null;
      longitude: number | null;
      title: string;
      subtitle: string;
      location: string;
      pointsLabel: string;
      meta: string[];
      image: string;
      href: { pathname: "/recycling-center/[id]"; params: { id: string } };
    }
  | {
      id: string;
      kind: "mission";
      mission: Mission;
      latitude: number | null;
      longitude: number | null;
      title: string;
      subtitle: string;
      location: string;
      pointsLabel: string;
      meta: string[];
      image: string;
      href: { pathname: "/mission/[id]"; params: { id: string } };
    };

const FILTERS: { key: ActivityKind; label: string }[] = [
  { key: "mission", label: "Misiones" },
  { key: "center", label: "Reciclaje" },
];

const CENTER_IMAGE =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80";

export function RecyclingMapScreen() {
  const [centers, setCenters] = useState<RecyclingCenter[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActivityKind>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedActivityId, setFocusedActivityId] = useState<string | null>(null);
  const [isMapTouching, setIsMapTouching] = useState(false);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);

  const mapRef = useRef<CentersMapRef>(null);

  const loadActivities = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setError(null);
      const [nextCenters, nextMissions] = await Promise.all([
        getRecyclingCenters(),
        getPublishedMissions(),
      ]);
      setCenters(nextCenters);
      setMissions(nextMissions);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar las actividades del mapa.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadActivities();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadActivities]);

  const activities = useMemo(
    () => [...missions.map(createMissionActivity), ...centers.map(createCenterActivity)],
    [centers, missions],
  );

  const filteredActivities = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return activities.filter((activity) => {
      if (activeFilter !== "all" && activity.kind !== activeFilter) {
        return false;
      }

      if (!cleanQuery) {
        return true;
      }

      return [
        activity.title,
        activity.subtitle,
        activity.location,
        activity.meta.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(cleanQuery);
    });
  }, [activeFilter, activities, query]);

  const mapActivities = useMemo<MapMarkerActivity[]>(
    () =>
      filteredActivities
        .filter(hasActivityCoordinates)
        .map((activity) => ({
          id: activity.id,
          kind: activity.kind,
          latitude: activity.latitude,
          location: activity.location,
          longitude: activity.longitude,
          name: activity.title,
          subtitle: activity.subtitle,
        })),
    [filteredActivities],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f8edb1" }}>
      <View
        onTouchCancel={() => setIsMapTouching(false)}
        onTouchEnd={() => setIsMapTouching(false)}
        onTouchStart={() => setIsMapTouching(true)}
        style={{ flex: 1, minHeight: 330 }}
      >
        <CentersMap ref={mapRef} activities={mapActivities} focusedActivityId={focusedActivityId} />
        
        {/* Header Search & Filter Bar */}
        <View style={{ position: "absolute", left: 14, right: 14, top: 14, gap: 8 }}>
          <View
            style={{
              minHeight: 44,
              alignItems: "center",
              borderRadius: 999,
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 14px rgba(20, 27, 43, 0.12)",
              flexDirection: "row",
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ color: "#627168", fontSize: 17, fontWeight: "900", marginRight: 8 }}>
              Q
            </Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setQuery}
              placeholder="Buscar por provincia, municipio o actividad..."
              placeholderTextColor="#97a29c"
              style={{ color: "#141b2b", flex: 1, fontSize: 12, minHeight: 42 }}
              value={query}
            />
            <Text style={{ color: "#23352d", fontSize: 16, fontWeight: "900" }}>|||</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={!isMapTouching}>
            <View style={{ flexDirection: "row", gap: 8, paddingRight: 14 }}>
              {FILTERS.map((filter) => {
                const isActive = filter.key === activeFilter;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={filter.key}
                    onPress={() => setActiveFilter((current) => (current === filter.key ? "all" : filter.key))}
                    style={{
                      minHeight: 29,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 999,
                      backgroundColor: isActive ? "#2d6a4f" : "#f7f8fb",
                      borderWidth: 1,
                      borderColor: isActive ? "#2d6a4f" : "#d8dde8",
                      paddingHorizontal: 14,
                    }}
                  >
                    <Text
                      style={{
                        color: isActive ? "#ffffff" : "#47564f",
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Floating Zoom Control Buttons */}
        <View
          style={{
            position: "absolute",
            right: 14,
            top: 116,
            borderRadius: 12,
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 14px rgba(20, 27, 43, 0.16)",
            overflow: "hidden",
            elevation: 4,
          }}
        >
          <Pressable
            accessibilityLabel="Acercar mapa"
            accessibilityRole="button"
            onPress={() => mapRef.current?.zoomIn()}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? "#eef3f0" : "#ffffff",
              borderBottomWidth: 1,
              borderBottomColor: "#eef2ef",
            })}
          >
            <Text style={{ color: "#141b2b", fontSize: 22, fontWeight: "900" }}>+</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Alejar mapa"
            accessibilityRole="button"
            onPress={() => mapRef.current?.zoomOut()}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? "#eef3f0" : "#ffffff",
            })}
          >
            <Text style={{ color: "#141b2b", fontSize: 22, fontWeight: "900" }}>−</Text>
          </Pressable>
        </View>
      </View>

      {/* Collapsible Bottom Sheet */}
      {isSheetCollapsed ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsSheetCollapsed(false)}
          style={({ pressed }) => ({
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 24,
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 999,
            backgroundColor: pressed ? "#23553f" : "#2d6a4f",
            paddingHorizontal: 18,
            boxShadow: "0 6px 18px rgba(20, 27, 43, 0.22)",
            elevation: 6,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 16 }}>📋</Text>
            <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
              Ver {filteredActivities.length} actividades en lista
            </Text>
          </View>
          <View
            style={{
              borderRadius: 999,
              backgroundColor: "rgba(255, 255, 255, 0.22)",
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "900" }}>▲ Desplegar</Text>
          </View>
        </Pressable>
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadActivities("refresh")}
            />
          }
          scrollEnabled={!isMapTouching}
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            bottom: 0,
            maxHeight: "54%",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            backgroundColor: "#ffffff",
            boxShadow: "0 -8px 22px rgba(20, 27, 43, 0.16)",
          }}
          contentContainerStyle={{ padding: 14, paddingBottom: 92, gap: 10 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text selectable style={{ color: "#141b2b", fontSize: 17, fontWeight: "900" }}>
              {filteredActivities.length} actividades cerca de ti
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsSheetCollapsed(true)}
              style={({ pressed }) => ({
                borderRadius: 999,
                backgroundColor: pressed ? "#dde5e0" : "#eef3f0",
                paddingHorizontal: 12,
                paddingVertical: 5,
              })}
            >
              <Text style={{ color: "#2d6a4f", fontSize: 12, fontWeight: "900" }}>▼ Ocultar</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={{ minHeight: 180, alignItems: "center", justifyContent: "center", gap: 12 }}>
              <ActivityIndicator color="#2d6a4f" />
              <Text selectable style={{ color: "#404943" }}>
                Cargando actividades...
              </Text>
            </View>
          ) : null}

          {!isLoading && error ? (
            <View
              style={{
                borderRadius: 8,
                backgroundColor: "#ffdad6",
                padding: 14,
                gap: 12,
              }}
            >
              <Text selectable style={{ color: "#93000a", fontWeight: "800" }}>
                {error}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadActivities()}
                style={{
                  minHeight: 42,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  backgroundColor: "#2d6a4f",
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "900" }}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && !error
            ? filteredActivities.map((activity) => (
                <ActivityCard
                  activity={activity}
                  key={activity.id}
                  onFocusMap={setFocusedActivityId}
                />
              ))
            : null}

          {!isLoading && !error && filteredActivities.length === 0 ? (
            <View
              style={{
                minHeight: 150,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: "#f5f8f6",
                padding: 20,
              }}
            >
              <Text selectable style={{ color: "#141b2b", fontWeight: "900", textAlign: "center" }}>
                No encontramos actividades con ese filtro.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function ActivityCard({
  activity,
  onFocusMap,
}: {
  activity: NearbyActivity;
  onFocusMap: (activityId: string) => void;
}) {
  return (
    <Link href={activity.href} asChild>
      <Pressable
        style={{
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#dce3df",
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 8px rgba(20, 27, 43, 0.08)",
          flexDirection: "row",
          gap: 10,
          padding: 9,
        }}
      >
        <Image
          source={activity.image}
          contentFit="cover"
          transition={180}
          style={{ width: 72, height: 72, borderRadius: 7, backgroundColor: "#e6ece8" }}
        />
        <View style={{ flex: 1, gap: 5 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Text
              selectable
              numberOfLines={2}
              style={{ flex: 1, color: "#141b2b", fontSize: 13, fontWeight: "900", lineHeight: 17 }}
            >
              {activity.title}
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                borderRadius: 4,
                backgroundColor: activity.kind === "mission" ? "#d8f3dc" : "#e5f4ea",
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: "#166534", fontSize: 9, fontWeight: "900" }}>
                {activity.pointsLabel}
              </Text>
            </View>
          </View>
          <Text selectable numberOfLines={1} style={{ color: "#2d6a4f", fontSize: 11, fontWeight: "800" }}>
            {activity.subtitle}
          </Text>
          <Text selectable numberOfLines={1} style={{ color: "#607068", fontSize: 11 }}>
            {activity.meta.join(" - ")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <Text selectable numberOfLines={1} style={{ flex: 1, color: "#3e4b45", fontSize: 11 }}>
              {activity.location}
            </Text>
            {hasActivityCoordinates(activity) ? (
              <Pressable
                accessibilityRole="button"
                onPress={(event) => {
                  event.stopPropagation();
                  onFocusMap(activity.id);
                }}
                style={{
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#dce3df",
                }}
              >
                <MapTargetIcon />
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function MapTargetIcon() {
  return (
    <View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          borderRadius: 999,
          borderWidth: 1.6,
          borderColor: "#141b2b",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 5,
          height: 5,
          borderRadius: 999,
          backgroundColor: "#141b2b",
        }}
      />
      <View style={{ position: "absolute", top: 0, width: 1.4, height: 4, backgroundColor: "#141b2b" }} />
      <View style={{ position: "absolute", bottom: 0, width: 1.4, height: 4, backgroundColor: "#141b2b" }} />
      <View style={{ position: "absolute", left: 0, width: 4, height: 1.4, backgroundColor: "#141b2b" }} />
      <View style={{ position: "absolute", right: 0, width: 4, height: 1.4, backgroundColor: "#141b2b" }} />
    </View>
  );
}

function createCenterActivity(center: RecyclingCenter): NearbyActivity {
  return {
    id: `center-${center.id}`,
    kind: "center",
    center,
    latitude: getNumberCoordinate(center.latitude),
    longitude: getNumberCoordinate(center.longitude),
    title: center.name,
    subtitle: "Centro de reciclaje",
    location: getCenterLocation(center),
    pointsLabel: "Variable",
    meta: ["Reciclaje", center.status === "ACTIVE" ? "Abierto ahora" : "Activo"],
    image: CENTER_IMAGE,
    href: { pathname: "/recycling-center/[id]", params: { id: center.id } },
  };
}

function createMissionActivity(mission: Mission): NearbyActivity {
  return {
    id: `mission-${mission.id}`,
    kind: "mission",
    mission,
    latitude: getNumberCoordinate(mission.latitude),
    longitude: getNumberCoordinate(mission.longitude),
    title: mission.title,
    subtitle: mission.mission_type,
    location: getMissionLocation(mission),
    pointsLabel: `+${mission.points_reward} pts`,
    meta: [formatMissionDate(mission.start_date), "Mision"],
    image: getMissionImage(mission.id),
    href: { pathname: "/mission/[id]", params: { id: mission.id } },
  };
}

function getNumberCoordinate(value: number | string | null | undefined) {
  const coordinate = Number(value);

  return Number.isFinite(coordinate) ? coordinate : null;
}

function hasActivityCoordinates(
  activity: NearbyActivity,
): activity is NearbyActivity & { latitude: number; longitude: number } {
  return typeof activity.latitude === "number" && typeof activity.longitude === "number";
}
