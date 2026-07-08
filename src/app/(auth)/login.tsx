import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/hooks/use-auth";

export default function LoginScreen() {
  const { login } = useAuth();
  const isDark = false;
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
      style={{ flex: 1, backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff" }}
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
            color: isDark ? "#f3fbf6" : "#141b2b",
            fontSize: 32,
            fontWeight: "800",
          }}
        >
          EcoPoints RD
        </Text>
        <Text selectable style={{ color: isDark ? "#c9d6cf" : "#404943", fontSize: 16 }}>
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
            borderColor: isDark ? "#314139" : "#d1d5db",
            backgroundColor: isDark ? "#ffffff" : "#ffffff",
            color: isDark ? "#ffffff" : "#141b2b",
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
            borderColor: isDark ? "#314139" : "#d1d5db",
            backgroundColor: isDark ? "#ffffff" : "#ffffff",
            color: isDark ? "#ffffff" : "#141b2b",
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
          backgroundColor: isDisabled ? "#90a79b" : "#2d6a4f",
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

      <Link href="/register" asChild>
        <Pressable
          accessibilityRole="button"
          style={{ minHeight: 42, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: "#2d6a4f", fontSize: 14, fontWeight: "800" }}>
            Crear cuenta
          </Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

