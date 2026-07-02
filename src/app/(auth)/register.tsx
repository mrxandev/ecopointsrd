import { Link } from "expo-router";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f7f8fb" }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 18 }}
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
          Crear cuenta
        </Text>
        <Text selectable style={{ color: isDark ? "#c9d6cf" : "#4d6258", fontSize: 16 }}>
          Solo necesitamos los datos obligatorios para empezar.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <AuthInput
          keyboardType="number-pad"
          label="Cedula"
          maxLength={13}
          onChangeText={handleCedulaChange}
          placeholder="000-0000000-0"
          value={cedula}
        />
        <AuthInput
          autoCapitalize="words"
          label="Nombre"
          onChangeText={(value) => setFirstName(normalizeName(value))}
          placeholder="Maria"
          value={firstName}
        />
        <AuthInput
          autoCapitalize="words"
          label="Apellido"
          onChangeText={(value) => setLastName(normalizeName(value))}
          placeholder="Gonzalez"
          value={lastName}
        />
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
            Registrarme
          </Text>
        )}
      </Pressable>

      <Link href="/login" asChild>
        <Pressable accessibilityRole="button" style={{ minHeight: 42, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#28734f", fontSize: 14, fontWeight: "800" }}>
            Ya tengo cuenta
          </Text>
        </Pressable>
      </Link>
    </ScrollView>
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const shouldHideText = Boolean(secureTextEntry && !isPasswordVisible);

  return (
    <View style={{ gap: 6 }}>
      <Text
        selectable
        style={{ color: isDark ? "#dce8e1" : "#34483e", fontSize: 13, fontWeight: "800" }}
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
          borderColor: isDark ? "#314139" : "#d4ddd8",
          backgroundColor: isDark ? "#17231f" : "#ffffff",
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
            color: isDark ? "#ffffff" : "#17231f",
            paddingHorizontal: 16,
            paddingRight: secureTextEntry ? 8 : 16,
            fontSize: 16,
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
            <Text style={{ color: "#28734f", fontSize: 18, fontWeight: "900" }}>
              {isPasswordVisible ? "◉" : "◌"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
