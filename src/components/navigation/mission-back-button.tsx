import { useRouter } from "expo-router";
import { Pressable, Text, useColorScheme } from "react-native";

export function MissionBackButton() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.back()}
      style={{
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
      }}
    >
      <Text style={{ color: isDark ? "#f3fbf6" : "#163326", fontSize: 28, lineHeight: 30 }}>
        {"<"}
      </Text>
    </Pressable>
  );
}
