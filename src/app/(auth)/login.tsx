import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import { useAuth } from "@/hooks/use-auth";

export default function LoginScreen() {
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Completa tu correo y contrasena para continuar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(cleanEmail, password);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "No pudimos iniciar sesion. Intenta de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDisabled = isSubmitting;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f7f8fb" }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
        gap: 22,
      }}
    >
      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{
            color: isDark ? "#f3fbf6" : "#163326",
            fontSize: 32,
            fontWeight: "800",
          }}
        >
          EcoPoints RD
        </Text>
        <Text selectable style={{ color: isDark ? "#c9d6cf" : "#4d6258", fontSize: 16 }}>
          Inicia sesion para continuar.
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Correo electronico"
          placeholderTextColor={isDark ? "#89958f" : "#7b8982"}
          style={{
            minHeight: 52,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isDark ? "#314139" : "#d4ddd8",
            backgroundColor: isDark ? "#17231f" : "#ffffff",
            color: isDark ? "#ffffff" : "#17231f",
            paddingHorizontal: 16,
            fontSize: 16,
          }}
          value={email}
        />

        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          onChangeText={setPassword}
          placeholder="Contrasena"
          placeholderTextColor={isDark ? "#89958f" : "#7b8982"}
          secureTextEntry
          style={{
            minHeight: 52,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isDark ? "#314139" : "#d4ddd8",
            backgroundColor: isDark ? "#17231f" : "#ffffff",
            color: isDark ? "#ffffff" : "#17231f",
            paddingHorizontal: 16,
            fontSize: 16,
          }}
          value={password}
        />
      </View>

      {error ? (
        <Text selectable style={{ color: "#b42318", fontSize: 14, fontWeight: "600" }}>
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={handleSubmit}
        style={{
          minHeight: 52,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          backgroundColor: isDisabled ? "#90a79b" : "#28734f",
        }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
            Iniciar sesion
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
