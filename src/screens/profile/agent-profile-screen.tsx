import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";

import { EditProfileModal, type EditProfileForm } from "@/components/ui/edit-profile-modal";
import { useAuth } from "@/hooks/use-auth";
import { getPublishedMissions, type Mission } from "@/services/mission-service";
import {
  getMyProfile,
  type UserProfile,
  updateMyProfile,
} from "@/services/user-service";

const palette = {
  background: "#f9f9ff",
  surface: "#ffffff",
  text: "#141b2b",
  textMuted: "#404943",
  outline: "#d1d5db",
  primary: "#2d6a4f",
  primaryDark: "#0f5238",
  primarySoft: "#d8f3dc",
  tertiary: "#0f4883",
  tertiarySoft: "#d4e3ff",
  error: "#ba1a1a",
  errorSoft: "#ffdad6",
};

function getDisplayName(profile: Pick<UserProfile, "first_name" | "last_name" | "email"> | null) {
  if (!profile) {
    return "Agente";
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();

  return fullName || profile.email;
}

function getRoleLabel(role?: string | null) {
  return role === "ADMIN" ? "Administrador" : "Agente de Campo";
}

export function AgentProfileScreen() {
  const { logout, token, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<EditProfileForm>({
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
        setError(new Error("Inicia sesion nuevamente para cargar tu perfil."));
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
        const [nextProfile, nextMissions] = await Promise.all([
          getMyProfile(token),
          getPublishedMissions(token).catch(() => []),
        ]);

        setProfile(nextProfile);
        setMissions(nextMissions);
        setForm({
          first_name: nextProfile.first_name ?? "",
          last_name: nextProfile.last_name ?? "",
          phone: nextProfile.phone ?? "",
          province: nextProfile.province ?? "",
          municipality: nextProfile.municipality ?? "",
          address: nextProfile.address ?? "",
          profile_image: nextProfile.profile_image ?? "",
        });
      } catch (profileError) {
        setError(
          profileError instanceof Error ? profileError : new Error("No pudimos cargar tu perfil."),
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

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = setTimeout(() => {
      setMessage(null);
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [message]);

  const activeProfile = profile ?? {
    id: user?.id ?? "",
    first_name: user?.first_name,
    last_name: user?.last_name,
    email: user?.email ?? "",
    role: user?.role ?? "AGENT",
    status: "ACTIVE",
    points: 0,
    total_points_earned: 0,
    total_points_redeemed: 0,
    completed_missions: 0,
    created_at: "",
    updated_at: "",
  };

  const validationSummary = useMemo(
    () => ({
      missionsToValidate: missions.length,
      registeredParticipants: missions.reduce(
        (total, mission) => total + (mission.registered_count ?? 0),
        0,
      ),
    }),
    [missions],
  );

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
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 14 }}
    >
      {isLoading ? (
        <View style={{ minHeight: 360, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color={palette.primary} />
          <Text selectable style={{ color: palette.textMuted }}>
            Cargando perfil...
          </Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <StateCard
          title={error.message}
          actionLabel={error.name === "401" || error.name === "403" ? "Iniciar sesión otra vez" : "Reintentar"}
          onAction={() =>
            error.name === "401" || error.name === "403" ? void logout() : void loadProfile()
          }
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
                backgroundColor: palette.surface,
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
              <Text selectable style={{ color: palette.text, fontSize: 19, fontWeight: "900" }}>
                {getDisplayName(activeProfile)}
              </Text>
              <Text selectable style={{ color: palette.textMuted, fontSize: 12 }}>
                {activeProfile.email}
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
                  {getRoleLabel(activeProfile.role)}
                </Text>
              </View>
            </View>
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
            <Text selectable style={{ color: "#ffffff", fontSize: 15, fontWeight: "900" }}>
              Resumen de Validaciones
            </Text>
            <ImpactRow
              label="Misiones disponibles hoy"
              value={formatNumber(validationSummary.missionsToValidate)}
            />
            <ImpactRow
              label="Participantes inscritos"
              value={formatNumber(validationSummary.registeredParticipants)}
            />
          </View>

          {isEditing ? (
            <EditProfileModal
              visible={isEditing}
              profile={activeProfile}
              form={form}
              isSaving={isSaving}
              onClose={() => setIsEditing(false)}
              onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
              onSave={handleSave}
            />
          ) : null}

          {message ? <InlineMessage message={message} success={!message.includes("No pudimos")} /> : null}

          <View
            style={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#e1e8fd",
              backgroundColor: palette.surface,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(20, 27, 43, 0.06)",
            }}
          >
            <MenuRow label="Editar perfil" icon="edit" onPress={() => setIsEditing((value) => !value)} />
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
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#e9edff",
        paddingHorizontal: 14,
        gap: 12,
      }}
    >
      <MenuIcon color={danger ? palette.error : palette.primaryDark} name={icon} />
      <Text
        style={{
          flex: 1,
          color: danger ? palette.error : palette.text,
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
      {!danger ? <Text style={{ color: palette.textMuted }}>{">"}</Text> : null}
    </Pressable>
  );
}

type MenuIconName = "edit" | "logout" | "privacy";

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
