import { Link, useRouter } from "expo-router";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDominicanCedula(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 10);
  const third = digits.slice(10, 11);

  if (digits.length > 10) {
    return `${first}-${second}-${third}`;
  }

  if (digits.length > 3) {
    return `${first}-${second}`;
  }

  return first;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase().replace(/\s/g, "");
}

function normalizeName(value: string) {
  return value.replace(/[^A-Za-z\s'-]/g, "").replace(/\s{2,}/g, " ");
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const isDark = false;
  const [cedula, setCedula] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleCedulaChange(value: string) {
    setCedula(formatDominicanCedula(value));
  }

  function handleEmailChange(value: string) {
    setEmail(normalizeEmail(value));
  }

  async function handleSubmit() {
    const cleanCedula = cedula.replace(/\D/g, "");
    const cleanEmail = email.trim().toLowerCase();
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanCedula || !cleanFirstName || !cleanLastName || !cleanEmail || !password) {
      setError("Completa cedula, nombre, apellido, correo y contrasena.");
      return;
    }

    if (cleanCedula.length !== 11) {
      setError("La cedula debe tener 11 digitos.");
      return;
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Ingresa un correo valido, por ejemplo nombre@email.com.");
      return;
    }

    if (password.length < 8) {
      setError("La contrasena debe tener minimo 8 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await register({
        cedula: cleanCedula,
        first_name: cleanFirstName,
        last_name: cleanLastName,
        email: cleanEmail,
        password,
      });
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : "No pudimos crear tu cuenta. Intenta de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff" }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 4,
        }}
      >
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontSize: 20 }}>←</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: "center", marginRight: 40 }}>
          <Text
            selectable
            style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontSize: 16, fontWeight: "800" }}
          >
            Crear cuenta
          </Text>
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 12, gap: 20 }}
      >
        <View style={{ alignItems: "center", gap: 12 }}>
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
                fontSize: 22,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              Unete a EcoPoints RD
            </Text>
            <Text
              selectable
              style={{
                color: isDark ? "#c9d6cf" : "#62776c",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              Recicla, gana puntos y contribuye a un pais mas limpio.
            </Text>
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <AuthInput
            keyboardType="number-pad"
            label="Cedula"
            maxLength={13}
            onChangeText={handleCedulaChange}
            placeholder="000-0000000-0"
            value={cedula}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AuthInput
                autoCapitalize="words"
                label="Nombre"
                onChangeText={(value) => setFirstName(normalizeName(value))}
                placeholder="Juan"
                value={firstName}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AuthInput
                autoCapitalize="words"
                label="Apellido"
                onChangeText={(value) => setLastName(normalizeName(value))}
                placeholder="Perez"
                value={lastName}
              />
            </View>
          </View>

          <AuthInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Correo electronico"
            onChangeText={handleEmailChange}
            placeholder="nombre@email.com"
            value={email}
          />
          <AuthInput
            autoCapitalize="none"
            autoComplete="password-new"
            isPasswordVisible={isPasswordVisible}
            label="Contrasena"
            onChangeText={setPassword}
            onTogglePasswordVisibility={() => setIsPasswordVisible((value) => !value)}
            placeholder="Minimo 8 caracteres"
            secureTextEntry
            value={password}
          />
        </View>

        {error ? (
          <Text selectable style={{ color: "#b42318", fontSize: 14, fontWeight: "700" }}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={{
            minHeight: 52,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: isSubmitting ? "#90a79b" : "#28734f",
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "800" }}>
              Crear cuenta
            </Text>
          )}
        </Pressable>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
          <Text style={{ color: isDark ? "#c9d6cf" : "#62776c", fontSize: 14 }}>
            ¿Ya tienes cuenta?
          </Text>
          <Link href="/login" asChild>
            <Pressable accessibilityRole="button">
              <Text style={{ color: "#28734f", fontSize: 14, fontWeight: "800" }}>
                Inicia sesion
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

function AuthInput({
  autoCapitalize,
  autoComplete,
  isPasswordVisible,
  keyboardType,
  label,
  maxLength,
  onChangeText,
  onTogglePasswordVisibility,
  placeholder,
  secureTextEntry,
  value,
}: {
  autoCapitalize?: "none" | "words";
  autoComplete?: "email" | "password-new";
  isPasswordVisible?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad";
  label: string;
  maxLength?: number;
  onChangeText: (value: string) => void;
  onTogglePasswordVisibility?: () => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  const isDark = false;
  const shouldHideText = Boolean(secureTextEntry && !isPasswordVisible);

  return (
    <View style={{ gap: 6 }}>
      <Text
        selectable
        style={{ color: isDark ? "#dce8e1" : "#404943", fontSize: 13, fontWeight: "800" }}
      >
        {label}
      </Text>
      <View
        style={{
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#d1d5db",
          backgroundColor: isDark ? "#ffffff" : "#ffffff",
        }}
      >
        <TextInput
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#89958f" : "#7b8982"}
          secureTextEntry={shouldHideText}
          style={{
            minHeight: 52,
            flex: 1,
            color: isDark ? "#ffffff" : "#141b2b",
            paddingHorizontal: 16,
            paddingRight: secureTextEntry ? 8 : 16,
            fontSize: 16,
            outlineWidth: 0,
          }}
          value={value}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? "Ocultar contrasena" : "Mostrar contrasena"}
            accessibilityRole="button"
            onPress={onTogglePasswordVisibility}
            style={{
              minWidth: 48,
              minHeight: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>{isPasswordVisible ? "🙈" : "👁️"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

