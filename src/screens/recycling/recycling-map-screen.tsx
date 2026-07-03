import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  type ScrollView as ScrollViewType,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import { getRecyclingCenters, type RecyclingCenter } from "@/services/recycling-service";
import { CentersMap } from "../../components/recycling/centers-map";
import { getCenterLocation, hasCoordinates } from "./recycling-utils";

export function RecyclingMapScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const scrollViewRef = useRef<ScrollViewType>(null);
  const [centers, setCenters] = useState<RecyclingCenter[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedCenterId, setFocusedCenterId] = useState<string | null>(null);
  const [isMapTouching, setIsMapTouching] = useState(false);

  const loadCenters = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setError(null);
      setCenters(await getRecyclingCenters());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No pudimos cargar los centros de reciclaje.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadCenters();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadCenters]);

  const filteredCenters = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return centers;
    }

    return centers.filter((center) =>
      [center.name, center.province, center.municipality, center.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(cleanQuery),
    );
  }, [centers, query]);

  const centersWithCoords = filteredCenters.filter(hasCoordinates);

  const focusCenterOnMap = useCallback((centerId: string) => {
    setFocusedCenterId(centerId);
    scrollViewRef.current?.scrollTo({ animated: true, y: 96 });
  }, []);

  return (
    <ScrollView
      ref={scrollViewRef}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadCenters("refresh")} />
      }
      scrollEnabled={!isMapTouching}
      style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f4f7f3" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 16 }}
    >
      <View style={{ gap: 4 }}>
        <Text
          selectable
          style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 28, fontWeight: "900" }}
        >
          Centros de reciclaje
        </Text>
        <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 14 }}>
          Encuentra puntos activos para llevar materiales reciclables.
        </Text>
      </View>

      <TextInput
        autoCapitalize="words"
        onChangeText={setQuery}
        placeholder="Buscar por nombre, provincia o municipio"
        placeholderTextColor={isDark ? "#89958f" : "#7b8982"}
        style={{
          minHeight: 48,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#d4ddd8",
          backgroundColor: isDark ? "#17231f" : "#ffffff",
          color: isDark ? "#ffffff" : "#17231f",
          paddingHorizontal: 14,
          fontSize: 14,
        }}
        value={query}
      />

      <View
        onTouchCancel={() => setIsMapTouching(false)}
        onTouchEnd={() => setIsMapTouching(false)}
        onTouchStart={() => setIsMapTouching(true)}
        style={{
          height: 280,
          overflow: "hidden",
          borderRadius: 8,
          backgroundColor: isDark ? "#17231f" : "#ffffff",
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#dbe4df",
        }}
      >
        <CentersMap centers={centersWithCoords} focusedCenterId={focusedCenterId} />
        {centersWithCoords.length === 0 ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "rgba(16,24,21,0.84)" : "rgba(244,247,243,0.86)",
              padding: 20,
            }}
          >
            <Text selectable style={{ color: isDark ? "#e7fff0" : "#166534", fontWeight: "800" }}>
              Los centros cargados no tienen coordenadas registradas.
            </Text>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View style={{ minHeight: 220, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color="#28734f" />
          <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c" }}>
            Cargando centros...
          </Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View
          style={{
            borderRadius: 8,
            backgroundColor: isDark ? "#351d1b" : "#fff0ee",
            padding: 14,
            gap: 12,
          }}
        >
          <Text selectable style={{ color: isDark ? "#ffd9d6" : "#8c1d18", fontWeight: "800" }}>
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadCenters()}
            style={{
              minHeight: 42,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: "#28734f",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "900" }}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && !error ? (
        <View style={{ gap: 10 }}>
          <Text
            selectable
            style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 16, fontWeight: "900" }}
          >
            {filteredCenters.length} centros encontrados
          </Text>
          {filteredCenters.map((center) => (
            <CenterCard key={center.id} center={center} onFocusMap={focusCenterOnMap} />
          ))}
        </View>
      ) : null}

      {!isLoading && !error && filteredCenters.length === 0 ? (
        <View
          style={{
            minHeight: 180,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: isDark ? "#17231f" : "#ffffff",
            padding: 20,
          }}
        >
          <Text selectable style={{ color: isDark ? "#f3fbf6" : "#17231f", fontWeight: "900" }}>
            No encontramos centros con ese filtro.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function CenterCard({
  center,
  onFocusMap,
}: {
  center: RecyclingCenter;
  onFocusMap: (centerId: string) => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Link href={{ pathname: "/recycling-center/[id]", params: { id: center.id } }} asChild>
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
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 16, fontWeight: "900" }}
            >
              {center.name}
            </Text>
            <Text selectable style={{ color: "#28734f", fontSize: 12, fontWeight: "800" }}>
              {getCenterLocation(center)}
            </Text>
          </View>
          <View
            style={{
              borderRadius: 999,
              backgroundColor: "#d7f8df",
              paddingHorizontal: 9,
              paddingVertical: 5,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: "#166534", fontSize: 11, fontWeight: "900" }}>Activo</Text>
          </View>
        </View>
        {center.address ? (
          <Text selectable numberOfLines={2} style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 13 }}>
            {center.address}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <ActionPill label="Ver detalle" />
          {hasCoordinates(center) ? (
            <Pressable
              accessibilityRole="button"
              onPress={(event) => {
                event.stopPropagation();
                onFocusMap(center.id);
              }}
            >
              <ActionPill label="Marcar" />
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

function ActionPill({ label }: { label: string }) {
  return (
    <View
      style={{
        minHeight: 30,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        backgroundColor: "#edf8f1",
        paddingHorizontal: 10,
      }}
    >
      <Text style={{ color: "#28734f", fontSize: 12, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}
