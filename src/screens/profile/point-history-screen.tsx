import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import {
  getMyPointTransactions,
  getMyPoints,
  type PointTransaction,
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

export function PointHistoryScreen() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [points, setPoints] = useState({ current: 0, earned: 0, redeemed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!token) {
        setError("Inicia sesion nuevamente para cargar tu historial.");
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
        const [nextPoints, nextTransactions] = await Promise.all([
          getMyPoints(token),
          getMyPointTransactions(token),
        ]);

        setPoints({
          current: nextPoints.points ?? 0,
          earned: nextPoints.total_points_earned ?? 0,
          redeemed: nextPoints.total_points_redeemed ?? 0,
        });
        setTransactions(nextTransactions);
      } catch (historyError) {
        setError(
          historyError instanceof Error
            ? historyError.message
            : "No pudimos cargar tu historial de puntos.",
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
      void loadHistory();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadHistory]);

  const totals = [
    { label: "Puntos", value: points.current, tone: "green" as const },
    { label: "Ganados", value: points.earned, tone: "blue" as const },
    { label: "Canjeados", value: points.redeemed, tone: "green" as const },
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadHistory("refresh")} />
      }
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
    >
      <View style={{ gap: 6 }}>
        <Text selectable style={{ color: palette.text, fontSize: 26, fontWeight: "900" }}>
          Historial de puntos
        </Text>
        <Text selectable style={{ color: palette.textMuted, fontSize: 14, lineHeight: 20 }}>
          Revisa tus movimientos recientes, puntos ganados y canjes realizados.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {totals.map((item) => (
          <SummaryCard key={item.label} label={item.label} tone={item.tone} value={item.value} />
        ))}
      </View>

      {isLoading ? (
        <View style={{ minHeight: 240, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color={palette.primary} />
          <Text selectable style={{ color: palette.textMuted }}>
            Cargando historial...
          </Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#f2b8b5",
            backgroundColor: palette.errorSoft,
            padding: 16,
            gap: 12,
          }}
        >
          <Text selectable style={{ color: "#93000a", fontWeight: "800" }}>
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadHistory()}
            style={{
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: palette.primary,
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "900" }}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && !error ? (
        <View style={{ gap: 10 }}>
          <Text selectable style={{ color: palette.text, fontSize: 16, fontWeight: "900" }}>
            Historial reciente
          </Text>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e1e8fd",
                backgroundColor: palette.surface,
                padding: 16,
              }}
            >
              <Text selectable style={{ color: palette.textMuted, fontSize: 13 }}>
                Todavia no tienes movimientos de puntos.
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

function SummaryCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "blue" | "green";
  value: number;
}) {
  const valueColor = tone === "blue" ? palette.tertiary : palette.primaryDark;
  const backgroundColor = tone === "blue" ? palette.tertiarySoft : palette.primarySoft;

  return (
    <View
      style={{
        flex: 1,
        minHeight: 70,
        borderRadius: 12,
        backgroundColor,
        padding: 12,
        justifyContent: "center",
        gap: 4,
      }}
    >
      <Text selectable style={{ color: valueColor, fontSize: 18, fontWeight: "900" }}>
        {formatNumber(value)}
      </Text>
      <Text selectable style={{ color: palette.textMuted, fontSize: 11, fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );
}

function TransactionRow({ transaction }: { transaction: PointTransaction }) {
  const isPositive = transaction.transaction_type !== "REDEEMED" && transaction.transaction_type !== "PENALTY";

  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e1e8fd",
        backgroundColor: palette.surface,
        padding: 14,
        gap: 6,
        boxShadow: "0 2px 8px rgba(20, 27, 43, 0.05)",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <Text
          selectable
          numberOfLines={1}
          style={{ flex: 1, color: palette.text, fontSize: 14, fontWeight: "800" }}
        >
          {transaction.description}
        </Text>
        <Text
          selectable
          style={{
            color: isPositive ? palette.primary : palette.error,
            fontWeight: "900",
            fontVariant: ["tabular-nums"],
          }}
        >
          {isPositive ? "+" : "-"}
          {formatNumber(transaction.points)}
        </Text>
      </View>
      <Text selectable style={{ color: palette.textMuted, fontSize: 12 }}>
        {formatTransactionType(transaction.transaction_type)} · {formatDate(transaction.created_at)}
      </Text>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-DO").format(value);
}

function formatTransactionType(type: string) {
  const labels: Record<string, string> = {
    BONUS: "Bono",
    EARNED: "Ganado",
    PENALTY: "Penalizacion",
    REDEEMED: "Canjeado",
  };

  return labels[type] ?? type;
}
