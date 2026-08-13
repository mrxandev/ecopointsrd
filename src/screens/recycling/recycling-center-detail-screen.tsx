import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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

const palette = {
  background: "#f9f9ff",
  surface: "#ffffff",
  surfaceLow: "#f1f3ff",
  text: "#141b2b",
  textMuted: "#404943",
  outline: "#d1d5db",
  primary: "#2d6a4f",
  primaryDark: "#0f5238",
  primarySoft: "#d8f3dc",
  error: "#ba1a1a",
  errorSoft: "#ffdad6",
};

export function RecyclingCenterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
          backgroundColor: palette.background,
          gap: 12,
        }}
      >
        <ActivityIndicator color={palette.primary} />
        <Text selectable style={{ color: palette.textMuted }}>
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
          backgroundColor: palette.background,
          padding: 20,
          gap: 12,
        }}
      >
        <Text selectable style={{ color: palette.text, fontWeight: "900" }}>
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
            backgroundColor: palette.primary,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "900" }}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const isActive = (center.status ?? "ACTIVE").toUpperCase() !== "INACTIVE";

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
    >
      <View
        style={{
          borderRadius: 12,
          backgroundColor: palette.primaryDark,
          padding: 18,
          gap: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(15, 82, 56, 0.18)",
        }}
      >
        <View
          style={{
            position: "absolute",
            right: -14,
            top: -12,
            width: 90,
            height: 90,
            borderRadius: 999,
            borderWidth: 10,
            borderColor: "rgba(168, 231, 197, 0.22)",
          }}
        />

        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            backgroundColor: isActive ? "rgba(216, 243, 220, 0.9)" : "rgba(255, 218, 214, 0.9)",
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Ionicons
            name={isActive ? "checkmark-circle" : "close-circle"}
            size={13}
            color={isActive ? "#166534" : "#93000a"}
          />
          <Text
            style={{
              color: isActive ? "#166534" : "#93000a",
              fontSize: 12,
              fontWeight: "900",
            }}
          >
            {isActive ? "Centro activo" : "Centro inactivo"}
          </Text>
        </View>

        <Text selectable style={{ color: "#ffffff", fontSize: 26, fontWeight: "900" }}>
          {center.name}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="location-outline" size={15} color="#d9fbe4" />
          <Text selectable style={{ color: "#d9fbe4", fontSize: 14, fontWeight: "800" }}>
            {getCenterLocation(center)}
          </Text>
        </View>
      </View>

      <InfoBlock
        icon="home-outline"
        label="Direccion"
        value={center.address ?? "Direccion no registrada"}
      />

      <InfoBlock
        icon="call-outline"
        label="Telefono"
        value={center.phone ?? "Telefono no registrado"}
        onPress={center.phone ? () => void Linking.openURL(`tel:${center.phone}`) : undefined}
      />

      <InfoBlock
        icon="document-text-outline"
        label="Descripcion"
        value={center.description ?? "Sin descripcion disponible."}
      />

      {hasCoordinates(center) ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void openCenterInMaps(center)}
          style={{
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 8,
            backgroundColor: palette.primary,
          }}
        >
          <Ionicons name="navigate-outline" size={18} color="#ffffff" />
          <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "900" }}>
            Abrir en Google Maps
          </Text>
        </Pressable>
      ) : (
        <View
          style={{
            borderRadius: 8,
            borderWidth: 1,
            borderColor: palette.outline,
            backgroundColor: palette.surfaceLow,
            padding: 14,
          }}
        >
          <Text selectable style={{ color: palette.textMuted, fontSize: 13 }}>
            Este centro aun no tiene ubicacion exacta registrada.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function InfoBlock({
  icon,
  label,
  onPress,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  value: string;
}) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: palette.outline,
        backgroundColor: palette.surface,
        padding: 14,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.primarySoft,
        }}
      >
        <Ionicons name={icon} size={17} color={palette.primaryDark} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text selectable style={{ color: palette.textMuted, fontSize: 12 }}>
          {label}
        </Text>
        <Text
          selectable
          style={{
            color: onPress ? palette.primaryDark : palette.text,
            fontSize: 15,
            fontWeight: "800",
            textDecorationLine: onPress ? "underline" : "none",
          }}
        >
          {value}
        </Text>
      </View>
    </Container>
  );
}
