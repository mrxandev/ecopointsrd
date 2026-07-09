import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff" }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff" }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
          gap: 24,
        }}
      >
      <View style={{ alignItems: "center", gap: 14 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#28734f",
          }}
        >
          <LeafGlyph />
        </View>

        <View style={{ alignItems: "center", gap: 4 }}>
          <Text
            selectable
            style={{
              color: isDark ? "#f3fbf6" : "#141b2b",
              fontSize: 24,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            Bienvenido de vuelta
          </Text>
          <Text
            selectable
            style={{
              color: isDark ? "#c9d6cf" : "#62776c",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            Inicia sesion para continuar participando
          </Text>
        </View>
      </View>

      <View style={{ gap: 14 }}>
        <View style={{ gap: 6 }}>
          <Text
            selectable
            style={{ color: isDark ? "#e5e9e7" : "#34483e", fontSize: 13, fontWeight: "700" }}
          >
            Correo electronico
          </Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor={isDark ? "#89958f" : "#9aa39d"}
            style={{
              minHeight: 52,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDark ? "#314139" : "#d1d5db",
              backgroundColor: isDark ? "#ffffff" : "#ffffff",
              color: isDark ? "#ffffff" : "#141b2b",
              paddingHorizontal: 16,
              fontSize: 16,
              outlineWidth: 0,
            }}
            value={email}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text
            selectable
            style={{ color: isDark ? "#e5e9e7" : "#34483e", fontSize: 13, fontWeight: "700" }}
          >
            Contrasena
          </Text>
          <View style={{ justifyContent: "center" }}>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={setPassword}
              placeholder="********"
              placeholderTextColor={isDark ? "#89958f" : "#9aa39d"}
              secureTextEntry={!isPasswordVisible}
              style={{
                minHeight: 52,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? "#314139" : "#d1d5db",
                backgroundColor: isDark ? "#ffffff" : "#ffffff",
                color: isDark ? "#ffffff" : "#141b2b",
                paddingHorizontal: 16,
                paddingRight: 44,
                fontSize: 16,
                outlineWidth: 0,
              }}
              value={password}
            />
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setIsPasswordVisible((visible) => !visible)}
              style={{ position: "absolute", right: 14 }}
            >
              <Text style={{ fontSize: 16 }}>{isPasswordVisible ? "🙈" : "👁️"}</Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" style={{ alignSelf: "flex-end" }}>
            <Text style={{ color: "#28734f", fontSize: 13, fontWeight: "700" }}>
              ¿Olvidaste tu contrasena?
            </Text>
          </Pressable>
        </View>
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

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
        <Text style={{ color: isDark ? "#c9d6cf" : "#62776c", fontSize: 14 }}>
          ¿No tienes cuenta?
        </Text>
        <Link href="/register" asChild>
          <Pressable accessibilityRole="button">
            <Text style={{ color: "#28734f", fontSize: 14, fontWeight: "800" }}>
              Registrate
            </Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LeafGlyph() {
  return (
    <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 17,
          height: 22,
          borderTopLeftRadius: 15,
          borderTopRightRadius: 3,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 15,
          backgroundColor: "#ffffff",
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 13,
          height: 2,
          borderRadius: 99,
          backgroundColor: "#28734f",
          transform: [{ rotate: "-35deg" }],
        }}
      />
    </View>
  );
}

