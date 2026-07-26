import { Modal, Pressable, Text, View } from "react-native";

type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  danger?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export function ConfirmationDialog({
  cancelLabel = "Cancelar",
  confirmLabel,
  danger,
  message,
  onCancel,
  onConfirm,
  title,
  visible,
}: ConfirmationDialogProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(20, 27, 43, 0.44)",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            borderRadius: 8,
            backgroundColor: "#ffffff",
            boxShadow: "0 18px 44px rgba(20, 27, 43, 0.22)",
            padding: 18,
            gap: 16,
          }}
        >
          <View style={{ gap: 10 }}>
            <View
              style={{
                width: 42,
                height: 42,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                backgroundColor: danger ? "#ffdad6" : "#d8f3dc",
              }}
            >
              <Text style={{ color: danger ? "#93000a" : "#0f5238", fontSize: 17, fontWeight: "900" }}>
                {danger ? "!" : "E"}
              </Text>
            </View>
            <Text selectable style={{ color: "#141b2b", fontSize: 19, fontWeight: "900", lineHeight: 24 }}>
              {title}
            </Text>
            <Text selectable style={{ color: "#4d5b54", fontSize: 14, lineHeight: 20 }}>
              {message}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={{
                flex: 1,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#cfd8d3",
                backgroundColor: "#ffffff",
              }}
            >
              <Text style={{ color: "#34443b", fontSize: 13, fontWeight: "900" }}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={{
                flex: 1,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: danger ? "#93000a" : "#0f5238",
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "900" }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
