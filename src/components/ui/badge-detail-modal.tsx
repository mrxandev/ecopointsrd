import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";

import {
  type BadgeDefinition,
  type BadgeTone,
  getBadgeStatus,
} from "@/services/badge-service";
import type { UserProfile } from "@/services/user-service";

const TONE_COLORS: Record<BadgeTone, { bg: string; border: string; text: string; iconBg: string }> = {
  gray: { bg: "#f0f4f2", border: "#d0dcd5", text: "#4a5a52", iconBg: "#e2ebe6" },
  green: { bg: "#e8f7ee", border: "#b8ebd0", text: "#1b5c3f", iconBg: "#d4f2e0" },
  blue: { bg: "#eef6ff", border: "#c2e0ff", text: "#1d6fa5", iconBg: "#daedff" },
  gold: { bg: "#fff9eb", border: "#ffe6b3", text: "#a36b00", iconBg: "#ffedc6" },
  purple: { bg: "#f7f0ff", border: "#e4cdff", text: "#6b21a8", iconBg: "#eedcff" },
};

export function BadgeDetailModal({
  badge,
  onClose,
  profile,
  visible,
}: {
  badge: BadgeDefinition | null;
  onClose: () => void;
  profile: UserProfile | null;
  visible: boolean;
}) {
  if (!badge) {
    return null;
  }

  const status = getBadgeStatus(badge, profile);
  const colors = TONE_COLORS[badge.tone] ?? TONE_COLORS.green;

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
          {/* Header Icon & Status Pill */}
          <View style={{ alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: status.isUnlocked ? colors.iconBg : "#f0f2f1",
                borderWidth: 2,
                borderColor: status.isUnlocked ? colors.border : "#dcdfe1",
                opacity: status.isUnlocked ? 1 : 0.6,
              }}
            >
              <Ionicons
                name={status.isUnlocked ? badge.iconName : "lock-closed-outline"}
                size={30}
                color={status.isUnlocked ? colors.text : "#72837a"}
              />
            </View>

            <Text selectable style={{ color: "#141b2b", fontSize: 20, fontWeight: "900", textAlign: "center" }}>
              {badge.title}
            </Text>

            <View
              style={{
                borderRadius: 999,
                backgroundColor: status.isUnlocked ? colors.bg : "#f1f3f2",
                borderWidth: 1,
                borderColor: status.isUnlocked ? colors.border : "#d9dedb",
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  color: status.isUnlocked ? colors.text : "#66756e",
                  fontSize: 12,
                  fontWeight: "800",
                }}
              >
                {status.isUnlocked ? "Insignia Desbloqueada" : "Insignia Bloqueada"}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text selectable style={{ color: "#485650", fontSize: 13, lineHeight: 19, textAlign: "center" }}>
            {badge.description}
          </Text>

          {/* How to obtain section */}
          <View
            style={{
              borderRadius: 12,
              backgroundColor: "#f7f9f8",
              borderWidth: 1,
              borderColor: "#e3e8e5",
              padding: 14,
              gap: 8,
            }}
          >
            <Text style={{ color: "#1b5c3f", fontSize: 12, fontWeight: "900", letterSpacing: 0.4 }}>
              ¿CÓMO SE OBTIENE?
            </Text>
            <Text selectable style={{ color: "#23332b", fontSize: 13, fontWeight: "700", lineHeight: 18 }}>
              {badge.requirementText}
            </Text>

            {/* Progress bar if target > 1 */}
            <View style={{ marginTop: 4, gap: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#62756c", fontSize: 11, fontWeight: "700" }}>Progreso</Text>
                <Text style={{ color: "#141b2b", fontSize: 11, fontWeight: "900" }}>
                  {new Intl.NumberFormat("es-DO").format(Math.min(status.current, status.target))} / {new Intl.NumberFormat("es-DO").format(status.target)} ({status.progressPercent}%)
                </Text>
              </View>
              <View
                style={{
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: "#e0e6e3",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${status.progressPercent}%`,
                    borderRadius: 999,
                    backgroundColor: status.isUnlocked ? "#28734f" : "#8aa095",
                  }}
                />
              </View>
            </View>
          </View>

          {/* Close button */}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => ({
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              backgroundColor: pressed ? "#1f5e40" : "#28734f",
            })}
          >
            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>Entendido</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
