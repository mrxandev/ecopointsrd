import { useRouter } from "expo-router";
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
import { changePasswordRequest } from "@/services/auth-service";

export default function ChangePasswordScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const isDark = false;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!token) {
      setIsSuccess(false);
      setMessage("Inicia sesión nuevamente para cambiar tu contraseña.");
      return;
    }

    if (!currentPassword || !newPassword) {
      setIsSuccess(false);
      setMessage("Completa tu contraseña actual y la nueva.");
      return;
    }

    if (newPassword.length < 8) {
      setIsSuccess(false);
      setMessage("La nueva contraseña debe tener mínimo 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsSuccess(false);
      setMessage("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const responseMessage = await changePasswordRequest(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsSuccess(true);
      setMessage(responseMessage);
    } catch (changeError) {
      setIsSuccess(false);
      setMessage(
        changeError instanceof Error
          ? changeError.message
          : "No pudimos cambiar tu contraseña.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: isDark ? "#f9f9ff" : "#f9f9ff" }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 18 }}
    >
      <View style={{ gap: 8 }}>
        <Text
          selectable
          style={{ color: isDark ? "#f3fbf6" : "#141b2b", fontSize: 30, fontWeight: "900" }}
        >
          Cambiar contraseña
        </Text>
        <Text selectable style={{ color: isDark ? "#b8c7bf" : "#404943", fontSize: 15 }}>
          Usa una nueva contraseña de mínimo 8 caracteres.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <PasswordInput
          onChangeText={setCurrentPassword}
          placeholder="Contraseña actual"
          value={currentPassword}
        />
        <PasswordInput
          onChangeText={setNewPassword}
          placeholder="Nueva contraseña"
          value={newPassword}
        />
        <PasswordInput
          onChangeText={setConfirmPassword}
          placeholder="Confirmar nueva contraseña"
          value={confirmPassword}
        />
      </View>

      {message ? (
        <View
          style={{
            borderRadius: 8,
            backgroundColor: isSuccess ? "#d8f3dc" : "#ffdad6",
            padding: 12,
          }}
        >
          <Text selectable style={{ color: isSuccess ? "#166534" : "#93000a", fontWeight: "800" }}>
            {message}
          </Text>
        </View>
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
          backgroundColor: isSubmitting ? "#90a79b" : "#2d6a4f",
        }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "900" }}>
            Guardar cambio
          </Text>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={{ minHeight: 42, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ color: "#2d6a4f", fontSize: 14, fontWeight: "800" }}>Volver</Text>
      </Pressable>
    </ScrollView>
  );
}

function PasswordInput({
  onChangeText,
  placeholder,
  value,
}: {
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const isDark = false;

  return (
    <TextInput
      autoCapitalize="none"
      onChangeText={onChangeText}
      placeholder={placeholder}
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
      value={value}
    />
  );
}

