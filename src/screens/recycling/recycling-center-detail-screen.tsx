import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
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
  const isDark = false;
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
          backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff",
          gap: 12,
        }}
      >
        <ActivityIndicator color="#2d6a4f" />
        <Text selectable style={{ color: isDark ? "#b8c7bf" : "#404943" }}>
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
          backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff",
          padding: 20,
          gap: 12,
        }}
      >
        <Text selectable style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontWeight: "900" }}>
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
            backgroundColor: "#2d6a4f",
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
      style={{ flex: 1, backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 16 }}
    >
      <View
        style={{
          minHeight: 190,
          borderRadius: 8,
          backgroundColor: isDark ? "#123325" : "#d8f3dc",
          padding: 18,
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: isDark ? "#e7fff0" : "#166534", fontSize: 13, fontWeight: "900" }}>
            Centro activo
          </Text>
          <Text selectable style={{ color: isDark ? "#ffffff" : "#141b2b", fontSize: 28, fontWeight: "900" }}>
            {center.name}
          </Text>
        </View>
        <Text selectable style={{ color: isDark ? "#d9fbe4" : "#2d6a4f", fontSize: 14, fontWeight: "800" }}>
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
            backgroundColor: "#2d6a4f",
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
  const isDark = false;

  return (
    <View
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isDark ? "#314139" : "#d1d5db",
        backgroundColor: isDark ? "#ffffff" : "#ffffff",
        padding: 14,
        gap: 5,
      }}
    >
      <Text selectable style={{ color: isDark ? "#9fb0a7" : "#404943", fontSize: 12 }}>
        {label}
      </Text>
      <Text selectable style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontSize: 15, fontWeight: "800" }}>
        {value}
      </Text>
    </View>
  );
}

