import { Pressable, ScrollView, Text, useColorScheme, View } from "react-native";

export default function ValidateScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f7f8fb" }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 18 }}
    >
      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: isDark ? "#f3fbf6" : "#163326",
            fontSize: 28,
            fontWeight: "800",
          }}
        >
          Validar
        </Text>
        <Text selectable style={{ color: isDark ? "#c9d6cf" : "#4d6258", fontSize: 16 }}>
          Modulo de validacion de actividades o QR.
        </Text>
      </View>

      <View
        style={{
          minHeight: 220,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: isDark ? "#3c4d45" : "#cbd8d1",
          backgroundColor: isDark ? "#17231f" : "#ffffff",
          padding: 24,
          gap: 16,
        }}
      >
        <Text
          selectable
          style={{
            color: isDark ? "#f3fbf6" : "#163326",
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Escaner pendiente
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled
          style={{
            minHeight: 46,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: "#90a79b",
            paddingHorizontal: 18,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}>
            Proximamente
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
