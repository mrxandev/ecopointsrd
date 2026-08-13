import { Ionicons } from "@expo/vector-icons";
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

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { UserQrModal } from "@/components/ui/user-qr-modal";
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
  tertiary: "#0f4883",
  tertiarySoft: "#d4e3ff",
  error: "#ba1a1a",
  errorSoft: "#ffdad6",
};

export function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const isDark = false;
  const [mission, setMission] = useState<Mission | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

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

  const availableSlots =
    mission.max_participants && typeof mission.registered_count === "number"
      ? Math.max(mission.max_participants - mission.registered_count, 0)
      : null;
  const participantProgress =
    mission.max_participants && typeof mission.registered_count === "number"
      ? Math.min(Math.max(mission.registered_count / mission.max_participants, 0), 1)
      : 0;
  const requirements = getMissionRequirements(mission);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 118 }}
      >
        <View>
          <Image
            source={getMissionImage(mission.id)}
            contentFit="cover"
            transition={180}
            style={{ height: 220, width: "100%" }}
          />
          <View
            style={{
              position: "absolute",
              left: 16,
              bottom: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              backgroundColor: "rgba(20, 27, 43, 0.55)",
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Ionicons name="leaf-outline" size={13} color="#d8f3dc" />
            <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "900" }}>
              {mission.mission_type}
            </Text>
          </View>
        </View>

        <View style={{ padding: 18, gap: 16 }}>
          <Text
            selectable
            style={{
              color: palette.text,
              fontSize: 24,
              fontWeight: "900",
              lineHeight: 29,
            }}
          >
            {mission.title}
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <InfoPill icon="calendar-outline" value={formatMissionDate(mission.start_date)} />
            <InfoPill icon="location-outline" value={getMissionLocation(mission)} />
            <InfoPill
              icon="people-outline"
              value={
                mission.max_participants && typeof mission.registered_count === "number"
                  ? `${mission.registered_count} de ${mission.max_participants}`
                  : "Cupos abiertos"
              }
            />
          </View>

          {mission.max_participants && typeof mission.registered_count === "number" ? (
            <View
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: palette.outline,
                backgroundColor: palette.surface,
                padding: 14,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: palette.text, fontSize: 12, fontWeight: "800" }}>
                  Participantes inscritos
                </Text>
                <Text style={{ color: palette.textMuted, fontSize: 12, fontWeight: "700" }}>
                  {availableSlots} cupos disponibles
                </Text>
              </View>
              <ProgressBar progress={participantProgress} />
            </View>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderRadius: 8,
              backgroundColor: palette.primarySoft,
              padding: 16,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
              }}
            >
              <Ionicons name="trophy-outline" size={20} color={palette.primaryDark} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text selectable style={{ color: palette.primary, fontSize: 12 }}>
                Recompensa confirmada
              </Text>
              <Text
                selectable
                style={{ color: palette.text, fontSize: 17, fontWeight: "900" }}
              >
                Ganaras {mission.points_reward} pts por participar
              </Text>
            </View>
          </View>

          {isRegistered ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: palette.outline,
                backgroundColor: palette.surface,
                padding: 16,
              }}
            >
              <Ionicons
                name={mission.my_registration_status === "COMPLETED" ? "checkmark-circle" : "time-outline"}
                size={22}
                color={palette.primaryDark}
              />
              <View style={{ gap: 2 }}>
                <Text selectable style={{ color: palette.textMuted, fontSize: 12 }}>
                  Estado de tu participacion
                </Text>
                <Text
                  selectable
                  style={{
                    color: palette.text,
                    fontSize: 16,
                    fontWeight: "900",
                  }}
                >
                  {mission.my_registration_status === "COMPLETED"
                    ? "Completada"
                    : "Inscrito"}
                </Text>
              </View>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: palette.outline,
              backgroundColor: palette.surface,
              padding: 16,
            }}
          >
            <Ionicons name="business-outline" size={22} color={palette.primaryDark} />
            <View style={{ gap: 2 }}>
              <Text selectable style={{ color: palette.textMuted, fontSize: 12 }}>
                Organizado por
              </Text>
              <Text
                selectable
                style={{ color: palette.text, fontSize: 16, fontWeight: "900" }}
              >
                {mission.organization_name ?? "Organizacion EcoPoints"}
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              selectable
              style={{ color: palette.text, fontSize: 16, fontWeight: "900" }}
            >
              Requisitos
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {requirements.map((requirement) => (
                <View
                  key={requirement}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: palette.outline,
                    backgroundColor: palette.surfaceLow,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={14} color={palette.primaryDark} />
                  <Text style={{ color: palette.text, fontSize: 12, fontWeight: "700" }}>
                    {requirement}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              selectable
              style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}
            >
              Descripcion
            </Text>
            <Text
              selectable
              style={{ color: "#374c42", fontSize: 14, lineHeight: 20 }}
            >
              {mission.description}
            </Text>
          </View>

          {actionMessage ? (
            <View
              style={{
                borderRadius: 8,
                backgroundColor: isRegistered ? palette.primarySoft : palette.errorSoft,
                padding: 14,
              }}
            >
              <Text
                selectable
                style={{
                  color: isRegistered ? "#166534" : "#93000a",
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
          backgroundColor: palette.background,
          borderTopWidth: 1,
          borderTopColor: palette.outline,
          gap: 10,
        }}
      >
        {isRegistered ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsQrModalOpen(true)}
            style={{
              minHeight: 48,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: "#28734f",
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
              Ver mi Código QR de Asistencia
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => setIsConfirmingAction(true)}
          style={{
            minHeight: isRegistered ? 42 : 52,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: isSubmitting ? "#90a79b" : isRegistered ? "#ffffff" : "#0f5238",
            borderWidth: isRegistered ? 1 : 0,
            borderColor: isRegistered ? "#f2b8b5" : "transparent",
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={isRegistered ? "#93000a" : "#ffffff"} />
          ) : (
            <Text style={{ color: isRegistered ? "#93000a" : "#ffffff", fontSize: 14, fontWeight: "800" }}>
              {isRegistered
                ? "Salirme de la mision"
                : `Inscribirme - ${mission.points_reward} pts`}
            </Text>
          )}
        </Pressable>
      </View>
      <ConfirmationDialog
        confirmLabel={isRegistered ? "Salir" : "Inscribirme"}
        danger={isRegistered}
        message={
          isRegistered
            ? `Vas a salir de "${mission.title}". Si cambias de opinion, podras inscribirte de nuevo si sigue disponible.`
            : `Te vas a inscribir en "${mission.title}" para participar por ${mission.points_reward} pts.`
        }
        onCancel={() => setIsConfirmingAction(false)}
        onConfirm={() => {
          setIsConfirmingAction(false);
          void handleRegistrationToggle();
        }}
        title={isRegistered ? "Salir de la mision" : "Confirmar inscripcion"}
        visible={isConfirmingAction}
      />
      {mission ? (
        <UserQrModal
          missionId={mission.id}
          missionTitle={mission.title}
          onClose={() => setIsQrModalOpen(false)}
          visible={isQrModalOpen}
        />
      ) : null}
    </View>
  );
}

function InfoPill({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        backgroundColor: palette.surfaceLow,
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Ionicons name={icon} size={13} color={palette.textMuted} />
      <Text selectable style={{ color: palette.textMuted, fontSize: 12, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
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

