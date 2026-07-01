import { Pressable, ScrollView, Text, useColorScheme, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";

function getDisplayName(user: ReturnType<typeof useAuth>["user"]) {
  if (!user) {
    return "Usuario";
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();

  return fullName || user.name || "Usuario";
}

export function ProfileScreen() {
  const { logout, role, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f7f8fb" }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 20 }}
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
          Perfil
        </Text>
        <Text selectable style={{ color: isDark ? "#c9d6cf" : "#4d6258", fontSize: 16 }}>
          Informacion de tu cuenta.
        </Text>
      </View>

      <View
        style={{
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#d4ddd8",
          backgroundColor: isDark ? "#17231f" : "#ffffff",
          padding: 18,
          gap: 14,
        }}
      >
        <ProfileRow label="Nombre" value={getDisplayName(user)} />
        <ProfileRow label="Correo" value={user?.email ?? "Sin correo"} />
        <ProfileRow label="Rol" value={role ?? "Sin rol"} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={logout}
        style={{
          minHeight: 52,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          backgroundColor: "#28734f",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
          Cerrar sesion
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{ gap: 4 }}>
      <Text selectable style={{ color: isDark ? "#9fb0a7" : "#63786e", fontSize: 13 }}>
        {label}
      </Text>
      <Text
        selectable
        style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 17, fontWeight: "700" }}
      >
        {value}
      </Text>
    </View>
  );
}
