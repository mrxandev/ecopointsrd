import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { MunicipalitySelect, ProvinceSelect } from "./geography-selectors";

// Dominican phone formatter
function formatDominicanPhone(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 10);
  if (cleaned.length === 0) return "";
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

const palette = {
  background: "#f9f9ff",
  surface: "#ffffff",
  surfaceLow: "#f1f3ff",
  surfaceVariant: "#dce2f7",
  text: "#141b2b",
  textMuted: "#404943",
  outline: "#d1d5db",
  outlineVariant: "#bfc9c1",
  primary: "#2d6a4f",
  primaryDark: "#0f5238",
  primarySoft: "#d8f3dc",
  success: "#52b788",
  tertiary: "#0f4883",
  tertiarySoft: "#d4e3ff",
  error: "#ba1a1a",
  errorSoft: "#ffdad6",
};

export type EditProfileForm = {
  first_name: string;
  last_name: string;
  phone: string;
  province: string;
  municipality: string;
  address: string;
  profile_image: string;
};

interface EditProfileModalProps {
  visible: boolean;
  profile: {
    profile_image?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  form: EditProfileForm;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => Promise<void> | void;
  onChange: (field: keyof EditProfileForm, value: string) => void;
}

const PROFILE_IMAGE_BASE_URL =
  "https://mdiprdoemvfwsknnbcox.supabase.co/storage/v1/object/public/imagenesPerfil";

const AVAILABLE_IMAGES = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  url: `${PROFILE_IMAGE_BASE_URL}/${i + 1}.png`,
}));

export function EditProfileModal({
  visible,
  profile,
  form,
  isSaving,
  onClose,
  onSave,
  onChange,
}: EditProfileModalProps) {
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  const errors = useMemo(() => {
    const nextErrors: Partial<Record<keyof EditProfileForm, string>> = {};

    if (!form.first_name.trim()) {
      nextErrors.first_name = "El nombre es obligatorio.";
    }

    if (!form.last_name.trim()) {
      nextErrors.last_name = "El apellido es obligatorio.";
    }

    if (form.phone && form.phone.replace(/\D/g, "").length > 0 && form.phone.replace(/\D/g, "").length < 10) {
      nextErrors.phone = "Ingresa un numero de telefono completo.";
    }

    return nextErrors;
  }, [form.first_name, form.last_name, form.phone]);

  const hasErrors = Object.keys(errors).length > 0;

  function handleSavePress() {
    setHasAttemptedSave(true);

    if (hasErrors) {
      return;
    }

    void onSave();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : undefined}
      >
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: palette.outline,
            backgroundColor: palette.surface,
            boxShadow: "0 2px 4px rgba(20, 27, 43, 0.08)",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: palette.text,
            }}
          >
            Editar Perfil
          </Text>
          <Pressable
            onPress={onClose}
            style={{
              padding: 8,
              borderRadius: 999,
              backgroundColor: palette.surfaceLow,
            }}
          >
            <Ionicons name="close" size={24} color={palette.text} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            gap: 16,
            paddingBottom: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image Preview - Compact */}
          <View style={{ alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 999,
                overflow: "hidden",
                borderWidth: 3,
                borderColor: palette.primary,
                backgroundColor: palette.surface,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(45, 106, 79, 0.15)",
              }}
            >
              {form.profile_image ? (
                <Image
                  source={form.profile_image}
                  contentFit="cover"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Text
                  style={{
                    color: palette.primary,
                    fontSize: 32,
                    fontWeight: "900",
                  }}
                >
                  {form.first_name?.slice(0, 1).toUpperCase() ?? "U"}
                </Text>
              )}
            </View>
          </View>

          {/* Image Selector Grid - 5 columns */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: palette.textMuted,
                paddingHorizontal: 4,
              }}
            >
              Selecciona tu imagen de perfil
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {AVAILABLE_IMAGES.map((image) => {
                const isSelected = form.profile_image === image.url;

                return (
                  <Pressable
                    key={image.id}
                    onPress={() => onChange("profile_image", image.url)}
                    style={{
                      position: "relative",
                      borderRadius: 8,
                      overflow: "hidden",
                      borderWidth: isSelected ? 3 : 1,
                      borderColor: isSelected
                        ? palette.primary
                        : palette.outline,
                      backgroundColor: palette.surfaceLow,
                      width: "18%",
                      aspectRatio: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      boxShadow: isSelected
                        ? "0 4px 12px rgba(45, 106, 79, 0.2)"
                        : "none",
                    }}
                  >
                    <Image
                      source={image.url}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      contentFit="cover"
                    />

                    {isSelected && (
                      <View
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          backgroundColor: palette.primary,
                          borderRadius: 50,
                          padding: 3,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons name="checkmark" size={12} color="#ffffff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: palette.outline,
              marginVertical: 8,
            }}
          />

          {/* Form Fields */}
          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: palette.text,
                paddingHorizontal: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Información Personal
            </Text>

            <FormField
              label="Nombre"
              value={form.first_name}
              onChangeText={(value) => onChange("first_name", value)}
              placeholder="Tu nombre"
              icon="person-outline"
              error={hasAttemptedSave ? errors.first_name : undefined}
            />

            <FormField
              label="Apellido"
              value={form.last_name}
              onChangeText={(value) => onChange("last_name", value)}
              placeholder="Tu apellido"
              icon="person-outline"
              error={hasAttemptedSave ? errors.last_name : undefined}
            />

            <FormField
              label="Teléfono"
              value={form.phone}
              onChangeText={(value) =>
                onChange("phone", formatDominicanPhone(value))
              }
              placeholder="Tu número de teléfono"
              icon="call-outline"
              keyboardType="phone-pad"
              maxLength={12}
              error={hasAttemptedSave ? errors.phone : undefined}
            />

            <ProvinceSelect
              value={form.province}
              onChange={(value) => {
                onChange("province", value);
                // Reset municipality when province changes
                onChange("municipality", "");
              }}
            />

            <MunicipalitySelect
              value={form.municipality}
              onChange={(value) => onChange("municipality", value)}
              province={form.province}
            />

            <FormField
              label="Dirección"
              value={form.address}
              onChangeText={(value) => onChange("address", value)}
              placeholder="Tu dirección"
              icon="home-outline"
              multiline
            />
          </View>

          {/* Spacing for button */}
          <View style={{ height: 8 }} />
        </ScrollView>

        {/* Footer Buttons */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            padding: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: palette.outline,
            backgroundColor: palette.surface,
          }}
        >
          <Pressable
            onPress={onClose}
            disabled={isSaving}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: palette.primary,
              backgroundColor: pressed ? palette.primarySoft : palette.surface,
              opacity: isSaving ? 0.5 : 1,
            })}
          >
            <Text
              style={{
                color: palette.primary,
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              Cancelar
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSavePress}
            disabled={isSaving || (hasAttemptedSave && hasErrors)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              backgroundColor:
                isSaving || (hasAttemptedSave && hasErrors)
                  ? palette.surfaceVariant
                  : palette.primary,
              opacity: pressed && !isSaving ? 0.9 : 1,
            })}
          >
            {isSaving ? (
              <ActivityIndicator color={palette.primary} />
            ) : (
              <Text
                style={{
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                Guardar Cambios
              </Text>
            )}
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  icon?: string;
  keyboardType?: "default" | "phone-pad" | "number-pad" | "email-address";
  multiline?: boolean;
  maxLength?: number;
  error?: string;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = "default",
  multiline = false,
  maxLength,
  error,
}: FormFieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 4,
        }}
      >
        {icon && (
          <Ionicons name={icon as any} size={14} color={palette.primary} />
        )}
        <Text
          style={{
            color: palette.textMuted,
            fontSize: 11,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      </View>
      <View
        style={{
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: error ? palette.error : palette.surfaceVariant,
          backgroundColor: palette.surface,
          paddingHorizontal: 14,
          paddingVertical: 2,
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(20, 27, 43, 0.08)",
        }}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={palette.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          maxLength={maxLength}
          style={{
            flex: 1,
            minHeight: multiline ? 70 : 46,
            color: palette.text,
            paddingVertical: multiline ? 10 : 0,
            fontSize: 14,
            fontFamily: "System",
          }}
        />
      </View>
      {error ? (
        <Text style={{ color: palette.error, fontSize: 11, fontWeight: "700", paddingHorizontal: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
