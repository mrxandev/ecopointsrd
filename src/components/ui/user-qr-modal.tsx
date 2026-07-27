import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

import { useAuth } from "@/hooks/use-auth";
import { generateUserQr, type QrSession } from "@/services/qr-service";
import { generateQrMatrix } from "@/utils/qr-encoder";

export function UserQrModal({
  missionId,
  missionTitle,
  onClose,
  visible,
}: {
  missionId: string;
  missionTitle: string;
  onClose: () => void;
  visible: boolean;
}) {
  const { token, user } = useAuth();
  const [qrSession, setQrSession] = useState<QrSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds

  const fetchQr = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const session = await generateUserQr(token);
      setQrSession(session);

      const expiresAt = new Date(session.expires_at).getTime();
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remainingSeconds || 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar código QR");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (visible) {
      void fetchQr();
    } else {
      setQrSession(null);
      setError(null);
    }
  }, [fetchQr, visible]);

  useEffect(() => {
    if (!visible || !qrSession || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrSession, timeLeft, visible]);

  const isExpired = timeLeft === 0;

  const payloadString = JSON.stringify({
    user_id: user?.id ?? "",
    qr_token: qrSession?.token ?? "",
    mission_id: missionId,
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(15, 23, 20, 0.65)",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 340,
            borderRadius: 20,
            backgroundColor: "#ffffff",
            padding: 24,
            alignItems: "center",
            gap: 16,
            boxShadow: "0 12px 32px rgba(20, 27, 43, 0.22)",
            elevation: 10,
          }}
        >
          {/* Header */}
          <View style={{ alignItems: "center", gap: 6 }}>
            <Ionicons name="qr-code-outline" size={28} color="#28734f" />
            <Text style={{ color: "#141b2b", fontSize: 18, fontWeight: "900", textAlign: "center" }}>
              Código QR de Asistencia
            </Text>
            <Text style={{ color: "#607369", fontSize: 12, textAlign: "center" }} numberOfLines={1}>
              {missionTitle}
            </Text>
          </View>

          {/* Clean High-Definition SVG QR Display Container */}
          <View
            style={{
              width: 220,
              height: 220,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: isExpired ? "#f2b8b5" : "#c2e0ff",
              backgroundColor: isExpired ? "#fff0ee" : "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {isLoading ? (
              <View style={{ gap: 10, alignItems: "center" }}>
                <ActivityIndicator color="#28734f" size="large" />
                <Text style={{ color: "#607369", fontSize: 12, fontWeight: "700" }}>Generando QR...</Text>
              </View>
            ) : error ? (
              <View style={{ gap: 8, alignItems: "center" }}>
                <Text style={{ color: "#93000a", fontSize: 12, fontWeight: "800", textAlign: "center" }}>
                  {error}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void fetchQr()}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: "#28734f",
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "800" }}>Reintentar</Text>
                </Pressable>
              </View>
            ) : isExpired ? (
              <View style={{ gap: 8, alignItems: "center" }}>
                <Text style={{ color: "#93000a", fontSize: 13, fontWeight: "900", textAlign: "center" }}>
                  Código Expirado
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void fetchQr()}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: "#28734f",
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "900" }}>
                    Generar nuevo QR
                  </Text>
                </Pressable>
              </View>
            ) : qrSession?.token ? (
              <View style={{ alignItems: "center", gap: 8 }}>
                <SvgQrView payload={payloadString} size={160} />
                <Text style={{ color: "#2d6a4f", fontSize: 10, fontWeight: "800", fontFamily: "monospace" }}>
                  TOKEN: {qrSession.token.slice(0, 14)}...
                </Text>
              </View>
            ) : null}
          </View>

          {/* Expiration Timer & Instructions */}
          {!isLoading && !error && !isExpired ? (
            <View style={{ alignItems: "center", gap: 4 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 999,
                  backgroundColor: "#e8f7ee",
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  gap: 5,
                }}
              >
                <Ionicons name="time-outline" size={14} color="#1b5c3f" />
                <Text style={{ color: "#1b5c3f", fontSize: 12, fontWeight: "900" }}>
                  Expira en {timeFormatted}
                </Text>
              </View>
              <Text style={{ color: "#607369", fontSize: 11, textAlign: "center", marginTop: 4 }}>
                Muestra este código al agente encuestador o auditor en la misión para registrar tu asistencia y recibir tus puntos.
              </Text>
            </View>
          ) : null}

          {/* Close button */}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => ({
              width: "100%",
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              backgroundColor: pressed ? "#e0e6e2" : "#eef3f0",
            })}
          >
            <Text style={{ color: "#28734f", fontSize: 14, fontWeight: "900" }}>Cerrar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Renders standard vector SVG QR matrix using react-native-svg */
function SvgQrView({ payload, size }: { payload: string; size: number }) {
  const matrix = generateQrMatrix(payload);
  const count = matrix.length;
  const cellSize = size / count;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background */}
      <Rect x={0} y={0} width={size} height={size} fill="#ffffff" />
      {/* QR Dark Cells */}
      {matrix.map((row, rIdx) =>
        row.map((isDark, cIdx) =>
          isDark ? (
            <Rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx * cellSize}
              y={rIdx * cellSize}
              width={cellSize + 0.1}
              height={cellSize + 0.1}
              fill="#141b2b"
            />
          ) : null
        )
      )}
    </Svg>
  );
}
