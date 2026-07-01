import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
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
  uploadMissionEvidence,
} from "@/services/mission-service";

export function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [mission, setMission] = useState<Mission | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");

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

  async function handleEvidenceSubmit() {
    if (!id || !token) {
      setActionMessage("Inicia sesion nuevamente para subir evidencia.");
      return;
    }

    const cleanUrl = evidenceUrl.trim();

    if (!cleanUrl) {
      setActionMessage("Agrega el enlace de tu evidencia para continuar.");
      return;
    }

    setIsUploadingEvidence(true);
    setActionMessage(null);

    try {
      const response = await uploadMissionEvidence(id, token, {
        file_url: cleanUrl,
        description: evidenceDescription.trim() || undefined,
      });
      setEvidenceUrl("");
      setEvidenceDescription("");
      setActionMessage(response?.message ?? "Evidencia subida correctamente.");
    } catch (uploadError) {
      setActionMessage(
        uploadError instanceof Error ? uploadError.message : "No pudimos subir la evidencia.",
      );
    } finally {
      setIsUploadingEvidence(false);
    }
  }

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
          backgroundColor: isDark ? "#101815" : "#f4f7f3",
          padding: 20,
          gap: 12,
        }}
      >
        <Text selectable style={{ color: isDark ? "#f3fbf6" : "#17231f", fontWeight: "800" }}>
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
            backgroundColor: "#28734f",
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "800" }}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f4f7f3" }}>
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
                color: isDark ? "#f3fbf6" : "#17231f",
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
              backgroundColor: isDark ? "#123325" : "#d7f8df",
              padding: 16,
              gap: 4,
            }}
          >
            <Text selectable style={{ color: isDark ? "#b9f2c7" : "#28734f", fontSize: 12 }}>
              Recompensa confirmada
            </Text>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 18, fontWeight: "900" }}
            >
              Ganaras {mission.points_reward} pts por participar
            </Text>
          </View>

          {isRegistered ? (
            <View
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? "#314139" : "#dbe4df",
                backgroundColor: isDark ? "#17231f" : "#ffffff",
                padding: 16,
                gap: 4,
              }}
            >
              <Text selectable style={{ color: isDark ? "#9fb0a7" : "#63786e", fontSize: 12 }}>
                Estado de tu participacion
              </Text>
              <Text
                selectable
                style={{
                  color: isDark ? "#f3fbf6" : "#17231f",
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
              borderColor: isDark ? "#314139" : "#dbe4df",
              backgroundColor: isDark ? "#17231f" : "#ffffff",
              padding: 16,
              gap: 4,
            }}
          >
            <Text selectable style={{ color: isDark ? "#9fb0a7" : "#63786e", fontSize: 12 }}>
              Organizado por
            </Text>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 16, fontWeight: "900" }}
            >
              {mission.organization_name ?? "Organizacion EcoPoints"}
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 18, fontWeight: "900" }}
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
              style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 18, fontWeight: "900" }}
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

          {isRegistered && mission.requires_evidence ? (
            <View
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? "#314139" : "#dbe4df",
                backgroundColor: isDark ? "#17231f" : "#ffffff",
                padding: 16,
                gap: 12,
              }}
            >
              <View style={{ gap: 4 }}>
                <Text
                  selectable
                  style={{
                    color: isDark ? "#f3fbf6" : "#17231f",
                    fontSize: 18,
                    fontWeight: "900",
                  }}
                >
                  Subir evidencia
                </Text>
                <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 13 }}>
                  Pega un enlace a una foto o archivo que demuestre tu participacion.
                </Text>
              </View>

              <TextInput
                autoCapitalize="none"
                onChangeText={setEvidenceUrl}
                placeholder="https://..."
                placeholderTextColor={isDark ? "#89958f" : "#7b8982"}
                style={{
                  minHeight: 48,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isDark ? "#314139" : "#d4ddd8",
                  backgroundColor: isDark ? "#101815" : "#f7faf8",
                  color: isDark ? "#ffffff" : "#17231f",
                  paddingHorizontal: 12,
                  fontSize: 14,
                }}
                value={evidenceUrl}
              />

              <TextInput
                multiline
                onChangeText={setEvidenceDescription}
                placeholder="Descripcion opcional"
                placeholderTextColor={isDark ? "#89958f" : "#7b8982"}
                style={{
                  minHeight: 78,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isDark ? "#314139" : "#d4ddd8",
                  backgroundColor: isDark ? "#101815" : "#f7faf8",
                  color: isDark ? "#ffffff" : "#17231f",
                  padding: 12,
                  fontSize: 14,
                  textAlignVertical: "top",
                }}
                value={evidenceDescription}
              />

              <Pressable
                accessibilityRole="button"
                disabled={isUploadingEvidence}
                onPress={handleEvidenceSubmit}
                style={{
                  minHeight: 46,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  backgroundColor: isUploadingEvidence ? "#90a79b" : "#28734f",
                }}
              >
                {isUploadingEvidence ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                    Enviar evidencia
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {actionMessage ? (
            <View
              style={{
                borderRadius: 8,
                backgroundColor: isRegistered
                  ? isDark
                    ? "#123325"
                    : "#d7f8df"
                  : isDark
                    ? "#351d1b"
                    : "#fff0ee",
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
                      : "#8c1d18",
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
          backgroundColor: isDark ? "#101815" : "#f4f7f3",
          borderTopWidth: 1,
          borderTopColor: isDark ? "#26332f" : "#dbe4df",
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
            backgroundColor: isSubmitting ? "#90a79b" : isRegistered ? "#8c1d18" : "#0f5f43",
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        borderRadius: 999,
        backgroundColor: isDark ? "#1b2823" : "#edf3ef",
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Text
        selectable
        style={{ color: isDark ? "#dce8e1" : "#34483e", fontSize: 12, fontWeight: "700" }}
      >
        {value}
      </Text>
    </View>
  );
}
