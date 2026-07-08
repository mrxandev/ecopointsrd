import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";

import { useAuth } from "@/hooks/use-auth";
import {
  formatMissionDate,
  getMissionImage,
  getMissionLocation,
  getMissionRequirements,
} from "@/screens/missions/mission-ui";
import {
  getMissionById,
  registerMission,
  type Mission,
  unregisterMission,
} from "@/services/mission-service";

export function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const isDark = false;
  const [mission, setMission] = useState<Mission | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadMission = useCallback(async () => {
    if (!id) {
      setError("No encontramos esta mision.");
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setActionMessage(null);
      setIsLoading(true);
      const nextMission = await getMissionById(id, token);
      setMission(nextMission);
      setIsRegistered(
        nextMission?.my_registration_status === "REGISTERED" ||
          nextMission?.my_registration_status === "COMPLETED",
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "No pudimos cargar esta mision.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadMission();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadMission]);

  async function handleRegistrationToggle() {
    if (!id || !token) {
      setActionMessage("Inicia sesion nuevamente para continuar.");
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    try {
      if (isRegistered) {
        const response = await unregisterMission(id, token);
        setIsRegistered(false);
        setMission((currentMission) =>
          currentMission ? { ...currentMission, my_registration_status: "CANCELLED" } : currentMission,
        );
        setActionMessage(response?.message ?? "Inscripcion cancelada correctamente.");
      } else {
        const response = await registerMission(id, token);
        setIsRegistered(true);
        setMission((currentMission) =>
          currentMission
            ? { ...currentMission, my_registration_status: "REGISTERED" }
            : currentMission,
        );
        setActionMessage(response?.message ?? "Inscripcion creada correctamente.");
      }
    } catch (registrationError) {
      if (registrationError instanceof Error && registrationError.name === "409") {
        setIsRegistered(true);
      }

      setActionMessage(
        registrationError instanceof Error
          ? registrationError.message
          : "No pudimos completar la accion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
          Cargando detalle...
        </Text>
      </View>
    );
  }

  if (error || !mission) {
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
        <Text selectable style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontWeight: "800" }}>
          {error ?? "No encontramos esta mision."}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void loadMission()}
          style={{
            minHeight: 46,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: "#2d6a4f",
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "800" }}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff" }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 118 }}
      >
        <Image
          source={getMissionImage(mission.id)}
          contentFit="cover"
          transition={180}
          style={{ height: 230, width: "100%" }}
        />

        <View style={{ padding: 18, gap: 16 }}>
          <View style={{ gap: 10 }}>
            <View
              style={{
                alignSelf: "flex-start",
                borderRadius: 999,
                backgroundColor: "#dff8e8",
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={{ color: "#166534", fontSize: 12, fontWeight: "900" }}>
                {mission.mission_type}
              </Text>
            </View>
            <Text
              selectable
              style={{
                color: isDark ? "#f3fbf6" : "#141b2b",
                fontSize: 25,
                fontWeight: "900",
                lineHeight: 30,
              }}
            >
              {mission.title}
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <InfoPill value={formatMissionDate(mission.start_date)} />
            <InfoPill value={getMissionLocation(mission)} />
          </View>

          <View
            style={{
              borderRadius: 8,
              backgroundColor: isDark ? "#123325" : "#d8f3dc",
              padding: 16,
              gap: 4,
            }}
          >
            <Text selectable style={{ color: isDark ? "#b9f2c7" : "#2d6a4f", fontSize: 12 }}>
              Recompensa confirmada
            </Text>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontSize: 18, fontWeight: "900" }}
            >
              Ganaras {mission.points_reward} pts por participar
            </Text>
          </View>

          {isRegistered ? (
            <View
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? "#314139" : "#d1d5db",
                backgroundColor: isDark ? "#ffffff" : "#ffffff",
                padding: 16,
                gap: 4,
              }}
            >
              <Text selectable style={{ color: isDark ? "#9fb0a7" : "#404943", fontSize: 12 }}>
                Estado de tu participacion
              </Text>
              <Text
                selectable
                style={{
                  color: isDark ? "#f3fbf6" : "#141b2b",
                  fontSize: 16,
                  fontWeight: "900",
                }}
              >
                {mission.my_registration_status === "COMPLETED"
                  ? "Completada"
                  : "Inscrito"}
              </Text>
            </View>
          ) : null}

          <View
            style={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDark ? "#314139" : "#d1d5db",
              backgroundColor: isDark ? "#ffffff" : "#ffffff",
              padding: 16,
              gap: 4,
            }}
          >
            <Text selectable style={{ color: isDark ? "#9fb0a7" : "#404943", fontSize: 12 }}>
              Organizado por
            </Text>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontSize: 16, fontWeight: "900" }}
            >
              {mission.organization_name ?? "Organizacion EcoPoints"}
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontSize: 18, fontWeight: "900" }}
            >
              Descripcion
            </Text>
            <Text
              selectable
              style={{ color: isDark ? "#c9d6cf" : "#374c42", fontSize: 14, lineHeight: 20 }}
            >
              {mission.description}
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontSize: 18, fontWeight: "900" }}
            >
              Que debes llevar?
            </Text>
            {getMissionRequirements(mission).map((requirement) => (
              <Text
                selectable
                key={requirement}
                style={{ color: isDark ? "#c9d6cf" : "#374c42", fontSize: 14 }}
              >
                - {requirement}
              </Text>
            ))}
          </View>

          {actionMessage ? (
            <View
              style={{
                borderRadius: 8,
                backgroundColor: isRegistered
                  ? isDark
                    ? "#123325"
                    : "#d8f3dc"
                  : isDark
                    ? "#351d1b"
                    : "#ffdad6",
                padding: 14,
              }}
            >
              <Text
                selectable
                style={{
                  color: isRegistered
                    ? isDark
                      ? "#b9f2c7"
                      : "#166534"
                    : isDark
                      ? "#ffd9d6"
                      : "#93000a",
                  fontSize: 13,
                  fontWeight: "800",
                }}
              >
                {actionMessage}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 14,
          backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff",
          borderTopWidth: 1,
          borderTopColor: isDark ? "#26332f" : "#d1d5db",
        }}
      >
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={handleRegistrationToggle}
          style={{
            minHeight: 52,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: isSubmitting ? "#90a79b" : isRegistered ? "#93000a" : "#0f5238",
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "900" }}>
              {isRegistered
                ? "Salirme de la mision"
                : `Inscribirme - ${mission.points_reward} pts`}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function InfoPill({ value }: { value: string }) {
  const isDark = false;

  return (
    <View
      style={{
        borderRadius: 999,
        backgroundColor: isDark ? "#1b2823" : "#f1f3ff",
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Text
        selectable
        style={{ color: isDark ? "#dce8e1" : "#404943", fontSize: 12, fontWeight: "700" }}
      >
        {value}
      </Text>
    </View>
  );
}

