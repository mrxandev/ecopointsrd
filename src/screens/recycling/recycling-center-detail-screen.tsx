import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";

import {
  getCenterLocation,
  hasCoordinates,
  openCenterInMaps,
} from "@/screens/recycling/recycling-utils";
import {
  getRecyclingCenterById,
  type RecyclingCenter,
} from "@/services/recycling-service";

export function RecyclingCenterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [center, setCenter] = useState<RecyclingCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCenter = useCallback(async () => {
    if (!id) {
      setError("No encontramos este centro.");
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      setCenter(await getRecyclingCenterById(id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No pudimos cargar este centro.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadCenter();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadCenter]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#101815" : "#f4f7f3",
          gap: 12,
        }}
      >
        <ActivityIndicator color="#28734f" />
        <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c" }}>
          Cargando centro...
        </Text>
      </View>
    );
  }

  if (error || !center) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: isDark ? "#101815" : "#f4f7f3",
          padding: 20,
          gap: 12,
        }}
      >
        <Text selectable style={{ color: isDark ? "#f3fbf6" : "#17231f", fontWeight: "900" }}>
          {error ?? "No encontramos este centro."}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void loadCenter()}
          style={{
            minHeight: 46,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: "#28734f",
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "900" }}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f4f7f3" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 16 }}
    >
      <View
        style={{
          minHeight: 190,
          borderRadius: 8,
          backgroundColor: isDark ? "#123325" : "#d7f8df",
          padding: 18,
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: isDark ? "#e7fff0" : "#166534", fontSize: 13, fontWeight: "900" }}>
            Centro activo
          </Text>
          <Text selectable style={{ color: isDark ? "#ffffff" : "#17231f", fontSize: 28, fontWeight: "900" }}>
            {center.name}
          </Text>
        </View>
        <Text selectable style={{ color: isDark ? "#d9fbe4" : "#28734f", fontSize: 14, fontWeight: "800" }}>
          {getCenterLocation(center)}
        </Text>
      </View>

      <InfoBlock label="Direccion" value={center.address ?? "Direccion no registrada"} />
      <InfoBlock label="Telefono" value={center.phone ?? "Telefono no registrado"} />
      <InfoBlock label="Descripcion" value={center.description ?? "Sin descripcion disponible."} />

      {hasCoordinates(center) ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void openCenterInMaps(center)}
          style={{
            minHeight: 52,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: "#28734f",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "900" }}>
            Abrir en Google Maps
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
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
        gap: 5,
      }}
    >
      <Text selectable style={{ color: isDark ? "#9fb0a7" : "#63786e", fontSize: 12 }}>
        {label}
      </Text>
      <Text selectable style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 15, fontWeight: "800" }}>
        {value}
      </Text>
    </View>
  );
}
