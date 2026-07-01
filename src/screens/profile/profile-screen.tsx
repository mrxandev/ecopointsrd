import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { Image } from "expo-image";

import { useAuth } from "@/hooks/use-auth";
import {
  getMyPointTransactions,
  getMyPoints,
  getMyProfile,
  type PointTransaction,
  type UserProfile,
  updateMyProfile,
} from "@/services/user-service";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
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
        const [nextProfile, nextPoints, nextTransactions] = await Promise.all([
          getMyProfile(token),
          getMyPoints(token),
          getMyPointTransactions(token),
        ]);
        const mergedProfile = {
          ...nextProfile,
          points: nextPoints.points ?? nextProfile.points,
          total_points_earned: nextPoints.total_points_earned ?? nextProfile.total_points_earned,
          total_points_redeemed:
            nextPoints.total_points_redeemed ?? nextProfile.total_points_redeemed,
        };

        setProfile(mergedProfile);
        setTransactions(nextTransactions);
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

  const level = Math.max(1, Math.floor(activeProfile.total_points_earned / 500) + 1);
  const recentTransactions = transactions.slice(0, 3);

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
      style={{ flex: 1, backgroundColor: isDark ? "#101815" : "#f4f7f3" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 92, gap: 14 }}
    >
      {isLoading ? (
        <View style={{ minHeight: 360, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color="#28734f" />
          <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c" }}>
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
          <View style={{ alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 82,
                height: 82,
                overflow: "hidden",
                borderRadius: 999,
                borderWidth: 4,
                borderColor: "#28734f",
                backgroundColor: isDark ? "#17231f" : "#ffffff",
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
                <Text style={{ color: "#28734f", fontSize: 26, fontWeight: "900" }}>
                  {getDisplayName(activeProfile).slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ alignItems: "center", gap: 3 }}>
              <Text
                selectable
                style={{
                  color: isDark ? "#f3fbf6" : "#17231f",
                  fontSize: 20,
                  fontWeight: "900",
                }}
              >
                {getDisplayName(activeProfile)}
              </Text>
              <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 12 }}>
                {[activeProfile.municipality, activeProfile.province].filter(Boolean).join(", ") ||
                  "Ubicacion sin completar"}
              </Text>
              {activeProfile.is_verified ? (
                <View
                  style={{
                    borderRadius: 999,
                    backgroundColor: "#d7f8df",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: "#166534", fontSize: 11, fontWeight: "900" }}>
                    Guardian Verde
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <StatCard label="Puntos" value={formatNumber(activeProfile.points)} />
            <StatCard label="Nivel" value={String(level)} />
            <StatCard label="Misiones" value={formatNumber(activeProfile.completed_missions)} />
          </View>

          <View
            style={{
              borderRadius: 8,
              backgroundColor: "#0f6b4a",
              padding: 16,
              gap: 12,
              overflow: "hidden",
            }}
          >
            <Text selectable style={{ color: "#ffffff", fontSize: 16, fontWeight: "900" }}>
              Tu impacto acumulado
            </Text>
            <ImpactRow label="Arboles plantados" value={formatNumber(impact.trees)} />
            <ImpactRow label="Kg reciclados" value={formatNumber(impact.recycling)} />
            <ImpactRow label="Horas voluntariado" value={`${formatNumber(impact.hours)}h`} />
          </View>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text
                selectable
                style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 16, fontWeight: "900" }}
              >
                Insignias recientes
              </Text>
              <Text selectable style={{ color: "#28734f", fontSize: 12, fontWeight: "800" }}>
                {activeProfile.completed_missions > 0 ? "Activas" : "Por ganar"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Badge label="Reforestador" icon="A" active={activeProfile.completed_missions >= 1} />
              <Badge label="Reciclador" icon="R" active={activeProfile.total_points_earned >= 200} />
              <Badge label="Primeros pasos" icon="P" active={activeProfile.points >= 0} />
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
              borderColor: isDark ? "#314139" : "#dbe4df",
              backgroundColor: isDark ? "#17231f" : "#ffffff",
              overflow: "hidden",
            }}
          >
            <MenuRow label="Editar perfil" icon="E" onPress={() => setIsEditing((value) => !value)} />
            <Link href="/recompensas" asChild>
              <MenuRow label="Recompensas" icon="R" />
            </Link>
            <MenuRow label="Historial de puntos" icon="H" />
            <MenuRow label="Privacidad" icon="P" />
            <MenuRow label="Cerrar sesion" icon="S" danger onPress={logout} />
          </View>

          <View style={{ gap: 10 }}>
            <Text
              selectable
              style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 16, fontWeight: "900" }}
            >
              Historial reciente
            </Text>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 13 }}>
                Todavia no tienes movimientos de puntos.
              </Text>
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-DO").format(value);
}

function StatCard({ label, value }: { label: string; value: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        flex: 1,
        minHeight: 66,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isDark ? "#314139" : "#dbe4df",
        backgroundColor: isDark ? "#17231f" : "#ffffff",
        gap: 4,
      }}
    >
      <Text selectable style={{ color: isDark ? "#f3fbf6" : "#17231f", fontSize: 17, fontWeight: "900" }}>
        {value}
      </Text>
      <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 11 }}>
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

function Badge({ active, icon, label }: { active: boolean; icon: string; label: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{ flex: 1, alignItems: "center", gap: 6, opacity: active ? 1 : 0.5 }}>
      <View
        style={{
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          backgroundColor: active ? "#d7f8df" : isDark ? "#17231f" : "#edf3ef",
        }}
      >
        <Text style={{ color: active ? "#28734f" : "#7b8982", fontSize: 18, fontWeight: "900" }}>
          {icon}
        </Text>
      </View>
      <Text
        selectable
        style={{
          color: isDark ? "#dce8e1" : "#34483e",
          fontSize: 11,
          fontWeight: "800",
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
  icon: string;
  label: string;
  onPress?: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#26332f" : "#edf3ef",
        paddingHorizontal: 14,
        gap: 12,
      }}
    >
      <Text style={{ color: danger ? "#c2410c" : "#28734f", width: 18, fontWeight: "900" }}>
        {icon}
      </Text>
      <Text
        style={{
          flex: 1,
          color: danger ? "#c2410c" : isDark ? "#f3fbf6" : "#17231f",
          fontSize: 14,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
      {!danger ? <Text style={{ color: isDark ? "#9fb0a7" : "#63786e" }}>{">"}</Text> : null}
    </Pressable>
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
            backgroundColor: "#edf3ef",
          }}
        >
          <Text style={{ color: "#34483e", fontWeight: "900" }}>Cancelar</Text>
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
            backgroundColor: isSaving ? "#90a79b" : "#28734f",
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{ gap: 5 }}>
      <Text selectable style={{ color: isDark ? "#b8c7bf" : "#62776c", fontSize: 12 }}>
        {label}
      </Text>
      <TextInput
        onChangeText={onChangeText}
        style={{
          minHeight: 46,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: isDark ? "#314139" : "#d4ddd8",
          backgroundColor: isDark ? "#17231f" : "#ffffff",
          color: isDark ? "#ffffff" : "#17231f",
          paddingHorizontal: 12,
          fontSize: 14,
        }}
        value={value}
      />
    </View>
  );
}

function TransactionRow({ transaction }: { transaction: PointTransaction }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isPositive = transaction.transaction_type !== "REDEEMED" && transaction.transaction_type !== "PENALTY";

  return (
    <View
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isDark ? "#314139" : "#dbe4df",
        backgroundColor: isDark ? "#17231f" : "#ffffff",
        padding: 12,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <Text
          selectable
          numberOfLines={1}
          style={{ flex: 1, color: isDark ? "#f3fbf6" : "#17231f", fontWeight: "800" }}
        >
          {transaction.description}
        </Text>
        <Text
          selectable
          style={{ color: isPositive ? "#28734f" : "#c2410c", fontWeight: "900" }}
        >
          {isPositive ? "+" : "-"}
          {formatNumber(transaction.points)}
        </Text>
      </View>
      <Text selectable style={{ color: isDark ? "#9fb0a7" : "#63786e", fontSize: 12 }}>
        {transaction.transaction_type}
      </Text>
    </View>
  );
}

function InlineMessage({ message, success }: { message: string; success: boolean }) {
  return (
    <View
      style={{
        borderRadius: 8,
        backgroundColor: success ? "#d7f8df" : "#fff0ee",
        padding: 12,
      }}
    >
      <Text selectable style={{ color: success ? "#166534" : "#8c1d18", fontWeight: "800" }}>
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
        borderColor: danger ? "#f2b8b5" : "#dbe4df",
        backgroundColor: danger ? "#fff0ee" : "#ffffff",
        padding: 16,
        gap: 12,
      }}
    >
      <Text selectable style={{ color: danger ? "#8c1d18" : "#17231f", fontWeight: "800" }}>
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
          backgroundColor: "#28734f",
        }}
      >
        <Text style={{ color: "#ffffff", fontWeight: "900" }}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
