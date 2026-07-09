import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";

import { useAuth } from "@/hooks/use-auth";
import {
  getMyPoints,
  getMyProfile,
  type UserProfile,
  updateMyProfile,
} from "@/services/user-service";
import { getLevelProgress } from "@/utils/level";

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

type EditableProfile = Pick<
  UserProfile,
  "first_name" | "last_name" | "phone" | "province" | "municipality" | "address" | "profile_image"
>;

function getDisplayName(user: Pick<UserProfile, "first_name" | "last_name" | "email"> | null) {
  if (!user) {
    return "Usuario";
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();

  return fullName || user.email;
}

export function ProfileScreen() {
  const { logout, token, user } = useAuth();
  const isDark = false;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<EditableProfile>({
    first_name: "",
    last_name: "",
    phone: "",
    province: "",
    municipality: "",
    address: "",
    profile_image: "",
  });

  const loadProfile = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!token) {
        setError("Inicia sesion nuevamente para cargar tu perfil.");
        setIsLoading(false);
        return;
      }

      if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        setError(null);
        setMessage(null);
        const [nextProfile, nextPoints] = await Promise.all([
          getMyProfile(token),
          getMyPoints(token),
        ]);
        const mergedProfile = {
          ...nextProfile,
          points: nextPoints.points ?? nextProfile.points,
          total_points_earned: nextPoints.total_points_earned ?? nextProfile.total_points_earned,
          total_points_redeemed:
            nextPoints.total_points_redeemed ?? nextProfile.total_points_redeemed,
        };

        setProfile(mergedProfile);
        setForm({
          first_name: mergedProfile.first_name ?? "",
          last_name: mergedProfile.last_name ?? "",
          phone: mergedProfile.phone ?? "",
          province: mergedProfile.province ?? "",
          municipality: mergedProfile.municipality ?? "",
          address: mergedProfile.address ?? "",
          profile_image: mergedProfile.profile_image ?? "",
        });
      } catch (profileError) {
        setError(
          profileError instanceof Error ? profileError.message : "No pudimos cargar tu perfil.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadProfile]);

  const activeProfile = profile ?? {
    id: user?.id ?? "",
    first_name: user?.first_name,
    last_name: user?.last_name,
    email: user?.email ?? "",
    role: user?.role ?? "USER",
    status: "ACTIVE",
    points: 0,
    total_points_earned: 0,
    total_points_redeemed: 0,
    completed_missions: 0,
    created_at: "",
    updated_at: "",
  };

  const impact = useMemo(
    () => ({
      trees: Math.max(0, Math.floor(activeProfile.completed_missions * 1.5)),
      recycling: Math.max(0, activeProfile.completed_missions * 2),
      hours: Math.max(0, activeProfile.completed_missions * 2),
    }),
    [activeProfile.completed_missions],
  );

  const levelInfo = useMemo(() => getLevelProgress(activeProfile.points), [activeProfile.points]);

  async function handleSave() {
    if (!token) {
      setMessage("Inicia sesion nuevamente para actualizar tu perfil.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const nextProfile = await updateMyProfile(token, {
        first_name: form.first_name?.trim() || null,
        last_name: form.last_name?.trim() || null,
        phone: form.phone?.trim() || null,
        province: form.province?.trim() || null,
        municipality: form.municipality?.trim() || null,
        address: form.address?.trim() || null,
        profile_image: form.profile_image?.trim() || null,
      });
      setProfile(nextProfile);
      setIsEditing(false);
      setMessage("Perfil actualizado correctamente.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "No pudimos actualizar tu perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadProfile("refresh")} />
      }
      style={{ flex: 1, backgroundColor: isDark ? "#f9f9ff" : palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 14 }}
    >
      {isLoading ? (
        <View style={{ minHeight: 360, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color={palette.primary} />
          <Text selectable style={{ color: isDark ? "#b8c7bf" : "#404943" }}>
            Cargando perfil...
          </Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <StateCard
          title={error}
          actionLabel="Reintentar"
          onAction={() => void loadProfile()}
          danger
        />
      ) : null}

      {!isLoading && !error ? (
        <>
          <View style={{ alignItems: "center", gap: 7 }}>
            <View
              style={{
                width: 74,
                height: 74,
                overflow: "hidden",
                borderRadius: 999,
                borderWidth: 3,
                borderColor: palette.primary,
                backgroundColor: isDark ? "#ffffff" : palette.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {activeProfile.profile_image ? (
                <Image
                  source={activeProfile.profile_image}
                  contentFit="cover"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Text style={{ color: palette.primary, fontSize: 24, fontWeight: "900" }}>
                  {getDisplayName(activeProfile).slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ alignItems: "center", gap: 3 }}>
              <Text
                selectable
                style={{
                  color: isDark ? "#f3fbf6" : palette.text,
                  fontSize: 19,
                  fontWeight: "900",
                }}
              >
                {getDisplayName(activeProfile)}
              </Text>
              <Text selectable style={{ color: isDark ? "#b8c7bf" : palette.textMuted, fontSize: 12 }}>
                {[activeProfile.municipality, activeProfile.province].filter(Boolean).join(", ") ||
                  "Ubicacion sin completar"}
              </Text>
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: palette.primarySoft,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ color: palette.primary, fontSize: 11, fontWeight: "900" }}>
                  {levelInfo.current.name}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <StatCard label="Puntos" value={formatNumber(activeProfile.points)} />
            <StatCard label="Actual" value={`Nivel ${levelInfo.levelNumber}`} />
            <StatCard label="Nacional" value="#23" accent="blue" />
          </View>

          <View
            style={{
              borderRadius: 12,
              backgroundColor: palette.primaryDark,
              padding: 16,
              gap: 11,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(15, 82, 56, 0.18)",
            }}
          >
            <View
              style={{
                position: "absolute",
                right: -12,
                top: -10,
                width: 80,
                height: 80,
                borderRadius: 999,
                borderWidth: 10,
                borderColor: "rgba(168, 231, 197, 0.22)",
              }}
            />
            <Text selectable style={{ color: "#ffffff", fontSize: 15, fontWeight: "900" }}>
              Tu Impacto Acumulado
            </Text>
            <ImpactRow label="Arboles Plantados" value={formatNumber(impact.trees)} />
            <ImpactRow label="Kg reciclados" value={formatNumber(impact.recycling)} />
            <ImpactRow label="Horas Voluntariado" value={`${formatNumber(impact.hours)}h`} />
          </View>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text
                selectable
                style={{ color: isDark ? "#f3fbf6" : palette.text, fontSize: 16, fontWeight: "900" }}
              >
                Insignias recientes
              </Text>
              <Text selectable style={{ color: palette.primary, fontSize: 11, fontWeight: "900" }}>
                Ver todas
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Badge label="Reforestador" icon="A" active={activeProfile.completed_missions >= 1} tone="green" />
              <Badge label="Reciclador" icon="R" active={activeProfile.total_points_earned >= 200} tone="blue" />
              <Badge label="Primeros pasos" icon="P" active={activeProfile.points >= 0} tone="gray" />
            </View>
          </View>

          {isEditing ? (
            <EditProfileForm
              form={form}
              isSaving={isSaving}
              onCancel={() => setIsEditing(false)}
              onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
              onSave={handleSave}
            />
          ) : null}

          {message ? <InlineMessage message={message} success={!message.includes("No pudimos")} /> : null}

          <View
            style={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDark ? "#314139" : "#e1e8fd",
              backgroundColor: isDark ? "#ffffff" : palette.surface,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(20, 27, 43, 0.06)",
            }}
          >
            <MenuRow label="Editar perfil" icon="edit" onPress={() => setIsEditing((value) => !value)} />
            <Link href="/recompensas" asChild>
              <MenuRow label="Recompensas" icon="rewards" />
            </Link>
            <Link href="/point-history" asChild>
              <MenuRow label="Historial de puntos" icon="history" />
            </Link>
            <MenuRow label="Privacidad" icon="privacy" />
            <MenuRow label="Cerrar sesion" icon="logout" danger onPress={logout} />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-DO").format(value);
}

function StatCard({ accent, label, value }: { accent?: "blue"; label: string; value: string }) {
  const isDark = false;
  const valueColor = accent === "blue" ? palette.tertiary : palette.primaryDark;

  return (
    <View
      style={{
        flex: 1,
        minHeight: 62,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDark ? "#314139" : "#e1e8fd",
        backgroundColor: isDark ? "#ffffff" : palette.surface,
        gap: 4,
        boxShadow: "0 2px 8px rgba(20, 27, 43, 0.06)",
      }}
    >
      <Text selectable style={{ color: isDark ? "#f3fbf6" : valueColor, fontSize: 16, fontWeight: "900" }}>
        {value}
      </Text>
      <Text selectable style={{ color: isDark ? "#b8c7bf" : palette.textMuted, fontSize: 11 }}>
        {label}
      </Text>
    </View>
  );
}

function ImpactRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text selectable style={{ color: "#e7fff0", fontSize: 13, fontWeight: "700" }}>
        {label}
      </Text>
      <Text selectable style={{ color: "#ffffff", fontSize: 14, fontWeight: "900" }}>
        {value}
      </Text>
    </View>
  );
}

function Badge({
  active,
  icon,
  label,
  tone,
}: {
  active: boolean;
  icon: string;
  label: string;
  tone: "blue" | "gray" | "green";
}) {
  const isDark = false;
  const activeBackground =
    tone === "green" ? palette.primarySoft : tone === "blue" ? palette.tertiarySoft : palette.surfaceVariant;
  const activeColor = tone === "blue" ? palette.tertiary : palette.primary;

  return (
    <View style={{ flex: 1, alignItems: "center", gap: 6, opacity: active ? 1 : 0.5 }}>
      <View
        style={{
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          borderWidth: 1,
          borderColor: active ? palette.outlineVariant : "transparent",
          backgroundColor: active ? activeBackground : isDark ? "#ffffff" : palette.surfaceLow,
        }}
      >
        <Text style={{ color: active ? activeColor : "#7b8982", fontSize: 18, fontWeight: "900" }}>
          {icon}
        </Text>
      </View>
      <Text
        selectable
        style={{
          color: isDark ? "#dce8e1" : palette.text,
          fontSize: 11,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function MenuRow({
  danger,
  icon,
  label,
  onPress,
}: {
  danger?: boolean;
  icon: MenuIconName;
  label: string;
  onPress?: () => void;
}) {
  const isDark = false;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#26332f" : "#e9edff",
        paddingHorizontal: 14,
        gap: 12,
      }}
    >
      <MenuIcon color={danger ? palette.error : palette.primaryDark} name={icon} />
      <Text
        style={{
          flex: 1,
          color: danger ? palette.error : isDark ? "#f3fbf6" : palette.text,
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
      {!danger ? <Text style={{ color: isDark ? "#9fb0a7" : "#404943" }}>{">"}</Text> : null}
    </Pressable>
  );
}

type MenuIconName = "edit" | "history" | "logout" | "privacy" | "rewards";

function MenuIcon({ color, name }: { color: string; name: MenuIconName }) {
  const stroke = { borderColor: color };

  if (name === "edit") {
    return (
      <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 13,
            height: 4,
            borderWidth: 1.6,
            borderRadius: 2,
            transform: [{ rotate: "-42deg" }],
            ...stroke,
          }}
        />
        <View
          style={{
            position: "absolute",
            right: 2,
            top: 2,
            width: 4,
            height: 4,
            borderTopWidth: 1.6,
            borderRightWidth: 1.6,
            transform: [{ rotate: "-42deg" }],
            ...stroke,
          }}
        />
      </View>
    );
  }

  if (name === "rewards") {
    return (
      <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
        <View style={{ position: "absolute", top: 3, flexDirection: "row", gap: 1 }}>
          <View style={{ width: 5, height: 5, borderWidth: 1.5, borderRadius: 99, ...stroke }} />
          <View style={{ width: 5, height: 5, borderWidth: 1.5, borderRadius: 99, ...stroke }} />
        </View>
        <View style={{ width: 15, height: 5, borderWidth: 1.5, borderRadius: 2, ...stroke }} />
        <View style={{ width: 13, height: 8, borderWidth: 1.5, borderTopWidth: 0, ...stroke }} />
        <View style={{ position: "absolute", bottom: 3, width: 1.5, height: 12, backgroundColor: color }} />
      </View>
    );
  }

  if (name === "history") {
    return (
      <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 13, height: 13, borderWidth: 1.6, borderRadius: 99, ...stroke }} />
        <View
          style={{
            position: "absolute",
            left: 1,
            top: 4,
            width: 5,
            height: 5,
            borderLeftWidth: 1.6,
            borderTopWidth: 1.6,
            transform: [{ rotate: "-35deg" }],
            ...stroke,
          }}
        />
        <View style={{ position: "absolute", width: 1.5, height: 5, backgroundColor: color }} />
        <View
          style={{
            position: "absolute",
            width: 5,
            height: 1.5,
            backgroundColor: color,
            transform: [{ translateX: 2 }, { translateY: 2 }],
          }}
        />
      </View>
    );
  }

  if (name === "privacy") {
    return (
      <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 12,
            height: 14,
            borderWidth: 1.6,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            borderBottomLeftRadius: 5,
            borderBottomRightRadius: 5,
            ...stroke,
          }}
        />
        <View style={{ position: "absolute", top: 6, width: 3, height: 3, borderRadius: 99, backgroundColor: color }} />
        <View style={{ position: "absolute", top: 9, width: 1.5, height: 4, backgroundColor: color }} />
      </View>
    );
  }

  return (
    <View style={{ width: 18, height: 18, justifyContent: "center" }}>
      <View
        style={{
          width: 10,
          height: 12,
          borderLeftWidth: 1.6,
          borderTopWidth: 1.6,
          borderBottomWidth: 1.6,
          borderTopLeftRadius: 2,
          borderBottomLeftRadius: 2,
          ...stroke,
        }}
      />
      <View style={{ position: "absolute", left: 6, width: 8, height: 1.6, backgroundColor: color }} />
      <View
        style={{
          position: "absolute",
          right: 1,
          width: 6,
          height: 6,
          borderTopWidth: 1.6,
          borderRightWidth: 1.6,
          transform: [{ rotate: "45deg" }],
          ...stroke,
        }}
      />
    </View>
  );
}

function EditProfileForm({
  form,
  isSaving,
  onCancel,
  onChange,
  onSave,
}: {
  form: EditableProfile;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (field: keyof EditableProfile, value: string) => void;
  onSave: () => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <EditableInput label="Nombre" value={form.first_name ?? ""} onChangeText={(value) => onChange("first_name", value)} />
      <EditableInput label="Apellido" value={form.last_name ?? ""} onChangeText={(value) => onChange("last_name", value)} />
      <EditableInput label="Telefono" value={form.phone ?? ""} onChangeText={(value) => onChange("phone", value)} />
      <EditableInput label="Provincia" value={form.province ?? ""} onChangeText={(value) => onChange("province", value)} />
      <EditableInput label="Municipio" value={form.municipality ?? ""} onChangeText={(value) => onChange("municipality", value)} />
      <EditableInput label="Direccion" value={form.address ?? ""} onChangeText={(value) => onChange("address", value)} />
      <EditableInput label="Imagen de perfil URL" value={form.profile_image ?? ""} onChangeText={(value) => onChange("profile_image", value)} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={{
            flex: 1,
            minHeight: 46,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: "#f1f3ff",
          }}
        >
          <Text style={{ color: palette.textMuted, fontWeight: "900" }}>Cancelar</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onSave}
          style={{
            flex: 1,
            minHeight: 46,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: isSaving ? "#90a79b" : palette.primary,
          }}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontWeight: "900" }}>Guardar</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function EditableInput({
  label,
  onChangeText,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  const isDark = false;

  return (
    <View style={{ gap: 5 }}>
      <Text selectable style={{ color: isDark ? "#b8c7bf" : "#404943", fontSize: 12 }}>
        {label}
      </Text>
      <TextInput
        onChangeText={onChangeText}
        style={{
          minHeight: 46,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : palette.outline,
          backgroundColor: isDark ? "#ffffff" : palette.surface,
          color: isDark ? "#ffffff" : palette.text,
          paddingHorizontal: 12,
          fontSize: 14,
        }}
        value={value}
      />
    </View>
  );
}

function InlineMessage({ message, success }: { message: string; success: boolean }) {
  return (
    <View
      style={{
        borderRadius: 8,
        backgroundColor: success ? palette.primarySoft : palette.errorSoft,
        padding: 12,
      }}
    >
      <Text selectable style={{ color: success ? palette.primaryDark : palette.error, fontWeight: "800" }}>
        {message}
      </Text>
    </View>
  );
}

function StateCard({
  actionLabel,
  danger,
  onAction,
  title,
}: {
  actionLabel: string;
  danger?: boolean;
  onAction: () => void;
  title: string;
}) {
  return (
    <View
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderColor: danger ? "#f2b8b5" : "#e1e8fd",
        backgroundColor: danger ? "#ffdad6" : palette.surface,
        padding: 16,
        gap: 12,
      }}
    >
      <Text selectable style={{ color: danger ? "#93000a" : palette.text, fontWeight: "800" }}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        style={{
          minHeight: 42,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          backgroundColor: palette.primary,
        }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "900" }}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

