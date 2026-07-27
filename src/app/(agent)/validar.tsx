import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";

import { useAuth } from "@/hooks/use-auth";
import {
  getMissionImage,
  getMissionLocation,
} from "@/screens/missions/mission-ui";
import {
  getPublishedMissions,
  type Mission,
  validateMissionParticipation,
} from "@/services/mission-service";
import { validateQrToken, type ValidatedQrUserData } from "@/services/qr-service";
import { searchUserByCedula } from "@/services/user-service";

export default function ValidateScreen() {
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isLoadingMissions, setIsLoadingMissions] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Scanner state
  const [isScannerPaused, setIsScannerPaused] = useState(false);
  const [isManualInputMode, setIsManualInputMode] = useState(false);
  const [cedulaInput, setCedulaInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  // Scanned / Searched user confirmation state
  const [pendingScanData, setPendingScanData] = useState<{
    qr_token?: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    user_cedula?: string;
  } | null>(null);

  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<{
    points: number;
    userName: string;
    missionTitle: string;
  } | null>(null);

  const loadMissions = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") {
      setIsRefreshing(true);
    } else {
      setIsLoadingMissions(true);
    }

    try {
      const list = await getPublishedMissions(token);
      setMissions(list);
    } catch {
      // Keep existing list
    } finally {
      setIsLoadingMissions(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void loadMissions();
  }, [loadMissions]);

  // Process QR Camera scan payload
  const processQrCodeData = async (rawCode: string) => {
    if (isScannerPaused || isCheckingUser || !selectedMission || !token) {
      return;
    }

    setIsScannerPaused(true);
    setIsCheckingUser(true);
    setValidationError(null);

    const trimmed = rawCode.trim();
    let extractedUserId = "";
    let extractedQrToken = "";

    try {
      const parsed = JSON.parse(trimmed) as {
        user_id?: string;
        userId?: string;
        qr_token?: string;
        qrToken?: string;
      };

      extractedUserId = parsed.user_id || parsed.userId || "";
      extractedQrToken = parsed.qr_token || parsed.qrToken || "";
    } catch {
      if (trimmed.length > 20) {
        extractedQrToken = trimmed;
      } else {
        extractedUserId = trimmed;
      }
    }

    try {
      let fetchedUserData: ValidatedQrUserData | null = null;

      if (extractedQrToken) {
        try {
          fetchedUserData = await validateQrToken(extractedQrToken, token);
        } catch (qrErr) {
          if (!extractedUserId) {
            throw qrErr;
          }
        }
      }

      const finalUserId = fetchedUserData?.user_id || extractedUserId;
      if (!finalUserId) {
        throw new Error("No pudimos identificar al participante en el código QR.");
      }

      const firstName = fetchedUserData?.first_name || "";
      const lastName = fetchedUserData?.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim() || `Usuario (${finalUserId.slice(0, 8)})`;

      setPendingScanData({
        qr_token: extractedQrToken,
        user_id: finalUserId,
        user_name: fullName,
        user_email: fetchedUserData?.email,
      });
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Código QR inválido o expirado.");
    } finally {
      setIsCheckingUser(false);
    }
  };

  // Search User by Cédula (Manual Lookup)
  const handleSearchByCedula = async () => {
    if (!token || !cedulaInput.trim()) {
      setValidationError("Ingresa un número de cédula válido.");
      return;
    }

    setIsCheckingUser(true);
    setValidationError(null);

    try {
      const userProfile = await searchUserByCedula(cedulaInput.trim(), token);
      const fullName = `${userProfile.first_name ?? ""} ${userProfile.last_name ?? ""}`.trim() || userProfile.email;

      setPendingScanData({
        user_id: userProfile.id,
        user_name: fullName,
        user_email: userProfile.email,
        user_cedula: userProfile.cedula || cedulaInput.trim(),
      });
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Error al buscar usuario por cédula.");
    } finally {
      setIsCheckingUser(false);
    }
  };

  // Barcode callback handler from camera
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (isScannerPaused || pendingScanData) {
      return;
    }
    void processQrCodeData(data);
  };

  // Confirm completion action (sends UUID to backend mission validate)
  const handleConfirmValidation = async () => {
    if (!token || !selectedMission || !pendingScanData) {
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await validateMissionParticipation(
        selectedMission.id,
        {
          user_id: pendingScanData.user_id,
          ...(pendingScanData.qr_token ? { qr_token: pendingScanData.qr_token } : {}),
          ...(notesInput.trim() ? { notes: notesInput.trim() } : {}),
        },
        token,
      );

      const pointsAwarded =
        response?.data?.validation?.points_awarded ?? selectedMission.points_reward ?? 0;

      setValidationSuccess({
        points: pointsAwarded,
        userName: pendingScanData.user_name || "Usuario",
        missionTitle: selectedMission.title,
      });

      // Clear pending scan data on success
      setPendingScanData(null);
      setCedulaInput("");
      setNotesInput("");
    } catch (err) {
      // Keep pendingScanData open or show error alert modal with exact message
      setValidationError(
        err instanceof Error ? err.message : "No pudimos completar la validación de la misión.",
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleResumeScanner = () => {
    setPendingScanData(null);
    setIsScannerPaused(false);
    setValidationError(null);
  };

  // -------------------------------------------------------------
  // PASO 1: SELECCIÓN DE MISIÓN DISPONIBLE (Menú Principal)
  // -------------------------------------------------------------
  if (!selectedMission) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadMissions("refresh")} />
        }
        style={{ flex: 1, backgroundColor: "#f4f7f4" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
      >
        {/* Header Banner */}
        <View style={{ gap: 6 }}>
          <Text selectable style={{ color: "#141b2b", fontSize: 22, fontWeight: "900" }}>
            Misiones para Validar
          </Text>
          <Text selectable style={{ color: "#56665e", fontSize: 13, lineHeight: 18 }}>
            Selecciona la misión ecológica en la que estás trabajando hoy para comenzar a escanear o buscar a los participantes.
          </Text>
        </View>

        {isLoadingMissions ? (
          <View style={{ minHeight: 220, alignItems: "center", justifyContent: "center", gap: 10 }}>
            <ActivityIndicator color="#28734f" size="large" />
            <Text style={{ color: "#607369", fontSize: 13, fontWeight: "700" }}>
              Cargando misiones disponibles...
            </Text>
          </View>
        ) : missions.length === 0 ? (
          <View
            style={{
              minHeight: 180,
              borderRadius: 14,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#d8dde8",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              gap: 10,
            }}
          >
            <Text style={{ color: "#141b2b", fontSize: 15, fontWeight: "900", textAlign: "center" }}>
              No hay misiones disponibles por el momento
            </Text>
            <Text style={{ color: "#607369", fontSize: 12, textAlign: "center" }}>
              Desliza hacia abajo para actualizar la lista.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {missions.map((mission) => (
              <Pressable
                accessibilityRole="button"
                key={mission.id}
                onPress={() => {
                  setSelectedMission(mission);
                  setIsScannerPaused(false);
                  setPendingScanData(null);
                  setValidationError(null);
                }}
                style={({ pressed }) => ({
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: pressed ? "#28734f" : "#d8dde8",
                  backgroundColor: pressed ? "#f0faf4" : "#ffffff",
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(20, 27, 43, 0.08)",
                  elevation: 2,
                })}
              >
                <View style={{ flexDirection: "row" }}>
                  <Image
                    source={getMissionImage(mission.id)}
                    contentFit="cover"
                    style={{ width: 100, height: 110, backgroundColor: "#e2ece6" }}
                  />
                  <View style={{ flex: 1, padding: 12, gap: 6, justifyContent: "space-between" }}>
                    <View style={{ gap: 3 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Text
                          selectable
                          numberOfLines={1}
                          style={{ color: "#28734f", fontSize: 11, fontWeight: "800", flex: 1 }}
                        >
                          {getMissionLocation(mission)}
                        </Text>
                        <View
                          style={{
                            borderRadius: 999,
                            backgroundColor: "#dcfce7",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                          }}
                        >
                          <Text style={{ color: "#166534", fontSize: 10, fontWeight: "900" }}>
                            +{mission.points_reward} pts
                          </Text>
                        </View>
                      </View>

                      <Text
                        selectable
                        numberOfLines={2}
                        style={{ color: "#141b2b", fontSize: 14, fontWeight: "900", lineHeight: 18 }}
                      >
                        {mission.title}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 4,
                      }}
                    >
                      <Text style={{ color: "#607369", fontSize: 11 }}>
                        {typeof mission.registered_count === "number"
                          ? `${mission.registered_count} inscritos`
                          : "Misión activa"}
                      </Text>
                      <View
                        style={{
                          borderRadius: 8,
                          backgroundColor: "#28734f",
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                        }}
                      >
                        <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "900" }}>
                          Seleccionar y Escanear →
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  // -------------------------------------------------------------
  // PASO 2: ESCÁNER QR O BÚSQUEDA POR CÉDULA DE LA MISIÓN SELECCIONADA
  // -------------------------------------------------------------
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: "#f4f7f4" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
    >
      {/* Selected Mission Banner */}
      <View
        style={{
          borderRadius: 14,
          backgroundColor: "#1b5c3f",
          padding: 16,
          gap: 10,
          boxShadow: "0 4px 14px rgba(20, 27, 43, 0.12)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#bfe8d2", fontSize: 11, fontWeight: "900", letterSpacing: 0.4 }}>
            MISIÓN EN VALIDACIÓN
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSelectedMission(null);
              setPendingScanData(null);
              setValidationError(null);
            }}
            style={({ pressed }) => ({
              borderRadius: 999,
              backgroundColor: pressed ? "#ffffff" : "rgba(255, 255, 255, 0.25)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.4)",
              paddingHorizontal: 12,
              paddingVertical: 5,
            })}
          >
            <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "900" }}>
              ← Cambiar Misión
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 2 }}>
          <Text selectable style={{ color: "#ffffff", fontSize: 18, fontWeight: "900" }}>
            {selectedMission.title}
          </Text>
          <Text selectable style={{ color: "#d2f5e3", fontSize: 12 }}>
            {getMissionLocation(selectedMission)} · Asigna{" "}
            <Text style={{ fontWeight: "900" }}>+{selectedMission.points_reward} pts</Text> por participante
          </Text>
        </View>
      </View>

      {/* Camera Scanner or Manual Cédula Search Container */}
      <View
        style={{
          borderRadius: 16,
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#d8dde8",
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(20, 27, 43, 0.08)",
        }}
      >
        {/* Toggle Mode Header */}
        <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: "#edf2ee", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name={isManualInputMode ? "card-outline" : "camera-outline"} size={20} color="#1b5c3f" />
            <Text style={{ color: "#141b2b", fontSize: 15, fontWeight: "900" }}>
              {isManualInputMode ? "Búsqueda Manual por Cédula" : "Escáner de Código QR"}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setIsManualInputMode(!isManualInputMode)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: "#e8f7ee",
              borderWidth: 1,
              borderColor: "#b8ebd0",
            }}
          >
            <Text style={{ color: "#1b5c3f", fontSize: 12, fontWeight: "800" }}>
              {isManualInputMode ? "Ver Cámara QR" : "Buscar por Cédula"}
            </Text>
          </Pressable>
        </View>

        {!isManualInputMode ? (
          /* Camera Scanner Viewport */
          <View style={{ height: 320, backgroundColor: "#0f1714", position: "relative" }}>
            {!permission?.granted ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
                <Ionicons name="camera-outline" size={44} color="#607369" />
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "800", textAlign: "center" }}>
                  Se requiere permiso de la cámara para escanear el QR del participante
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void requestPermission()}
                  style={{
                    borderRadius: 8,
                    backgroundColor: "#28734f",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                    Conceder Permiso de Cámara
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <CameraView
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                  onBarcodeScanned={isScannerPaused ? undefined : handleBarcodeScanned}
                  style={{ flex: 1 }}
                />

                {/* Viewfinder Target Overlay */}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <View
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isCheckingUser ? "#eab308" : "#28734f",
                      backgroundColor: "rgba(40, 115, 79, 0.08)",
                    }}
                  />
                  <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "800", marginTop: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
                    Apunta la cámara al código QR del usuario
                  </Text>
                </View>

                {isCheckingUser ? (
                  <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15, 23, 20, 0.75)", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <ActivityIndicator color="#ffffff" size="large" />
                    <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                      Verificando datos del participante...
                    </Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : (
          /* Manual Cédula Search Mode */
          <View style={{ padding: 16, gap: 14 }}>
            <Text style={{ color: "#56665e", fontSize: 13, lineHeight: 18 }}>
              Ingresa el número de cédula del usuario para buscarlo en la base de datos y obtener su UUID para validar la misión:
            </Text>

            <View style={{ gap: 6 }}>
              <Text style={{ color: "#404943", fontSize: 12, fontWeight: "800" }}>
                Cédula del Usuario: *
              </Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setCedulaInput}
                placeholder="Ej: 00112345678 o 402..."
                placeholderTextColor="#97a29c"
                style={{
                  height: 48,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#c6d0c8",
                  backgroundColor: "#ffffff",
                  paddingHorizontal: 14,
                  fontSize: 14,
                  color: "#141b2b",
                  fontWeight: "700",
                }}
                value={cedulaInput}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isCheckingUser || !cedulaInput.trim()}
              onPress={() => void handleSearchByCedula()}
              style={{
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                backgroundColor: cedulaInput.trim() ? "#28734f" : "#90a79b",
              }}
            >
              {isCheckingUser ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                  Buscar Usuario por Cédula
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE CONFIRMACIÓN: DATOS DEL USUARIO Y RESUMEN DE LA MISIÓN */}
      {/* ------------------------------------------------------------- */}
      <Modal
        animationType="slide"
        transparent
        visible={Boolean(pendingScanData)}
        onRequestClose={handleResumeScanner}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 20, 0.7)",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 20,
              backgroundColor: "#ffffff",
              padding: 22,
              gap: 16,
              boxShadow: "0 12px 32px rgba(20, 27, 43, 0.25)",
              elevation: 10,
            }}
          >
            {/* Header */}
            <View style={{ gap: 4, alignItems: "center" }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  backgroundColor: "#e8f7ee",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person-circle-outline" size={32} color="#1b5c3f" />
              </View>
              <Text style={{ color: "#141b2b", fontSize: 18, fontWeight: "900", textAlign: "center" }}>
                Confirmar Participante
              </Text>
              <Text style={{ color: "#607369", fontSize: 12, textAlign: "center" }}>
                Verifica los datos del usuario antes de acreditar los puntos.
              </Text>
            </View>

            {/* Participant Data Box */}
            <View
              style={{
                borderRadius: 12,
                backgroundColor: "#f4f8f5",
                borderWidth: 1,
                borderColor: "#cce6d8",
                padding: 14,
                gap: 10,
              }}
            >
              <Text style={{ color: "#1b5c3f", fontSize: 11, fontWeight: "900", letterSpacing: 0.4 }}>
                DATOS DEL PARTICIPANTE
              </Text>

              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#607369", fontSize: 12 }}>Nombre:</Text>
                  <Text selectable style={{ color: "#141b2b", fontSize: 14, fontWeight: "900" }}>
                    {pendingScanData?.user_name || "Usuario EcoPoints"}
                  </Text>
                </View>

                {pendingScanData?.user_cedula ? (
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: "#607369", fontSize: 12 }}>Cédula:</Text>
                    <Text selectable style={{ color: "#166534", fontSize: 13, fontWeight: "900" }}>
                      {pendingScanData.user_cedula}
                    </Text>
                  </View>
                ) : null}

                {pendingScanData?.user_email ? (
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: "#607369", fontSize: 12 }}>Correo:</Text>
                    <Text selectable style={{ color: "#141b2b", fontSize: 12, fontWeight: "700" }}>
                      {pendingScanData.user_email}
                    </Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#607369", fontSize: 12 }}>UUID a Validar:</Text>
                  <Text selectable style={{ color: "#56665e", fontSize: 11, fontFamily: "monospace" }}>
                    {pendingScanData?.user_id.slice(0, 16)}...
                  </Text>
                </View>
              </View>
            </View>

            {/* Mission Summary Box */}
            <View
              style={{
                borderRadius: 12,
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: "#d8dde8",
                padding: 14,
                gap: 8,
              }}
            >
              <Text style={{ color: "#28734f", fontSize: 11, fontWeight: "900", letterSpacing: 0.4 }}>
                RESUMEN DE LA MISIÓN
              </Text>

              <Text selectable style={{ color: "#141b2b", fontSize: 14, fontWeight: "900" }}>
                {selectedMission.title}
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#607369", fontSize: 12 }}>Puntos a otorgar:</Text>
                <View style={{ borderRadius: 999, backgroundColor: "#dcfce7", paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: "#166534", fontSize: 13, fontWeight: "900" }}>
                    +{selectedMission.points_reward} pts
                  </Text>
                </View>
              </View>
            </View>

            {/* Optional Notes */}
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#404943", fontSize: 11, fontWeight: "700" }}>Notas / Observaciones (opcional):</Text>
              <TextInput
                onChangeText={setNotesInput}
                placeholder="Ej: Asistencia comprobada por cédula"
                placeholderTextColor="#97a29c"
                style={{
                  height: 38,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#c6d0c8",
                  backgroundColor: "#ffffff",
                  paddingHorizontal: 10,
                  fontSize: 12,
                  color: "#141b2b",
                }}
                value={notesInput}
              />
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 8, marginTop: 4 }}>
              <Pressable
                accessibilityRole="button"
                disabled={isValidating}
                onPress={() => void handleConfirmValidation()}
                style={{
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  backgroundColor: isValidating ? "#90a79b" : "#28734f",
                }}
              >
                {isValidating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                    Confirmar y Completar Misión
                  </Text>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={isValidating}
                onPress={handleResumeScanner}
                style={{
                  minHeight: 42,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  backgroundColor: "#f0f4f2",
                }}
              >
                <Text style={{ color: "#607369", fontSize: 13, fontWeight: "800" }}>
                  Cancelar / Volver a Buscar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE ERROR DE VALIDACIÓN (Si el usuario no está inscrito, etc) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        animationType="fade"
        transparent
        visible={Boolean(validationError)}
        onRequestClose={handleResumeScanner}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 20, 0.7)",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 340,
              borderRadius: 20,
              backgroundColor: "#ffffff",
              padding: 24,
              alignItems: "center",
              gap: 14,
              boxShadow: "0 12px 32px rgba(20, 27, 43, 0.25)",
              elevation: 10,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 999,
                backgroundColor: "#ffdad6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="alert-circle-outline" size={36} color="#93000a" />
            </View>

            <Text selectable style={{ color: "#141b2b", fontSize: 18, fontWeight: "900", textAlign: "center" }}>
              No se pudo validar la misión
            </Text>

            <View
              style={{
                width: "100%",
                borderRadius: 12,
                backgroundColor: "#fff0ee",
                borderWidth: 1,
                borderColor: "#f2b8b5",
                padding: 14,
              }}
            >
              <Text selectable style={{ color: "#8c1d18", fontSize: 13, fontWeight: "700", textAlign: "center", lineHeight: 18 }}>
                {validationError}
              </Text>
            </View>

            {pendingScanData?.user_name ? (
              <Text style={{ color: "#607369", fontSize: 12, textAlign: "center" }}>
                Participante: <Text style={{ fontWeight: "800", color: "#141b2b" }}>{pendingScanData.user_name}</Text>
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={handleResumeScanner}
              style={{
                width: "100%",
                minHeight: 46,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                backgroundColor: "#28734f",
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                Entendido / Continuar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE ÉXITO */}
      {/* ------------------------------------------------------------- */}
      <Modal
        animationType="fade"
        transparent
        visible={Boolean(validationSuccess)}
        onRequestClose={() => {
          setValidationSuccess(null);
          handleResumeScanner();
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 20, 0.65)",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 340,
              borderRadius: 20,
              backgroundColor: "#ffffff",
              padding: 24,
              alignItems: "center",
              gap: 14,
              boxShadow: "0 12px 32px rgba(20, 27, 43, 0.22)",
              elevation: 10,
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={60} color="#28734f" />

            <Text selectable style={{ color: "#141b2b", fontSize: 20, fontWeight: "900", textAlign: "center" }}>
              ¡Asistencia Validada Exitosamente!
            </Text>

            <Text style={{ color: "#56665e", fontSize: 13, textAlign: "center", lineHeight: 18 }}>
              Se registraron los puntos para <Text style={{ fontWeight: "900", color: "#141b2b" }}>{validationSuccess?.userName}</Text> y su estado en la misión cambió a <Text style={{ fontWeight: "900", color: "#166534" }}>COMPLETADO</Text>.
            </Text>

            <View
              style={{
                width: "100%",
                borderRadius: 12,
                backgroundColor: "#f4f8f5",
                padding: 14,
                gap: 6,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#607369", fontSize: 11, fontWeight: "700" }}>PUNTOS ACREDITADOS</Text>
              <Text style={{ color: "#166534", fontSize: 26, fontWeight: "900" }}>
                +{validationSuccess?.points} pts
              </Text>
              <Text numberOfLines={1} style={{ color: "#141b2b", fontSize: 12, fontWeight: "800" }}>
                {validationSuccess?.missionTitle}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setValidationSuccess(null);
                handleResumeScanner();
              }}
              style={{
                width: "100%",
                minHeight: 46,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                backgroundColor: "#28734f",
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
                Validar Siguiente Usuario
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
