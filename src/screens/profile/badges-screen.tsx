import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import { BadgeDetailModal } from "@/components/ui/badge-detail-modal";
import { useAuth } from "@/hooks/use-auth";
import {
  BADGES_CATALOG,
  type BadgeDefinition,
  getBadgeStatus,
} from "@/services/badge-service";
import {
  getMyPoints,
  getMyProfile,
  type UserProfile,
} from "@/services/user-service";

type FilterTab = "all" | "unlocked" | "locked";

export function BadgesScreen() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  const loadData = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (mode === "refresh") {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [nextProfile, nextPoints] = await Promise.all([
        getMyProfile(token),
        getMyPoints(token).catch(() => ({ points: 0, total_points_earned: 0, total_points_redeemed: 0 })),
      ]);

      setProfile({
        ...nextProfile,
        points: nextPoints.points ?? nextProfile.points,
        total_points_earned: nextPoints.total_points_earned ?? nextProfile.total_points_earned,
        total_points_redeemed: nextPoints.total_points_redeemed ?? nextProfile.total_points_redeemed,
      });
    } catch {
      // Keep existing profile fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const badgesWithStatus = useMemo(() => {
    return BADGES_CATALOG.map((badge) => ({
      badge,
      status: getBadgeStatus(badge, profile),
    }));
  }, [profile]);

  const unlockedCount = useMemo(
    () => badgesWithStatus.filter((b) => b.status.isUnlocked).length,
    [badgesWithStatus],
  );

  const filteredBadges = useMemo(() => {
    let list = badgesWithStatus;
    if (activeTab === "unlocked") {
      list = badgesWithStatus.filter((b) => b.status.isUnlocked);
    } else if (activeTab === "locked") {
      list = badgesWithStatus.filter((b) => !b.status.isUnlocked);
    }

    return [...list].sort((a, b) => {
      if (a.status.isUnlocked === b.status.isUnlocked) {
        return 0;
      }
      return a.status.isUnlocked ? -1 : 1;
    });
  }, [activeTab, badgesWithStatus]);

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f7f4" }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadData("refresh")} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
      >
        {/* Summary Card */}
        <View
          style={{
            borderRadius: 16,
            backgroundColor: "#1b5c3f",
            padding: 18,
            gap: 10,
            boxShadow: "0 4px 14px rgba(20, 27, 43, 0.12)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 20 }}>🏅</Text>
            <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "900" }}>
              Insignias Ecológicas
            </Text>
          </View>
          <Text style={{ color: "#d2f5e3", fontSize: 13, lineHeight: 18 }}>
            Desbloquea logros completando misiones y acumulando puntos en EcoPoints RD. Toca cualquier insignia para ver cómo obtenerla.
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
            <View
              style={{
                borderRadius: 999,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "800" }}>
                {unlockedCount} / {BADGES_CATALOG.length} Obtenidas
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(
            [
              { key: "all", label: "Todas" },
              { key: "unlocked", label: `Obtenidas (${unlockedCount})` },
              { key: "locked", label: `Bloqueadas (${BADGES_CATALOG.length - unlockedCount})` },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                accessibilityRole="button"
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: isActive ? "#28734f" : "#ffffff",
                  borderWidth: 1,
                  borderColor: isActive ? "#28734f" : "#d3ded8",
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#ffffff" : "#405248",
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View style={{ minHeight: 200, alignItems: "center", justifyContent: "center", gap: 10 }}>
            <ActivityIndicator color="#28734f" />
            <Text style={{ color: "#607369", fontSize: 13 }}>Cargando insignias...</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredBadges.map(({ badge, status }) => (
              <Pressable
                accessibilityRole="button"
                key={badge.id}
                onPress={() => setSelectedBadge(badge)}
                style={({ pressed }) => ({
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: status.isUnlocked ? "#cce6d8" : "#e2e8e4",
                  backgroundColor: pressed
                    ? status.isUnlocked
                      ? "#f0faf4"
                      : "#f7faf8"
                    : "#ffffff",
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  boxShadow: "0 2px 8px rgba(20, 27, 43, 0.06)",
                })}
              >
                {/* Badge Icon */}
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: status.isUnlocked ? "#e8f7ee" : "#f0f2f1",
                    borderWidth: 1.5,
                    borderColor: status.isUnlocked ? "#b8ebd0" : "#dcdfe1",
                    opacity: status.isUnlocked ? 1 : 0.6,
                  }}
                >
                  <Text style={{ fontSize: 26 }}>{status.isUnlocked ? badge.icon : "🔒"}</Text>
                </View>

                {/* Badge Details */}
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text selectable style={{ color: "#141b2b", fontSize: 15, fontWeight: "900" }}>
                      {badge.title}
                    </Text>
                    <View
                      style={{
                        borderRadius: 999,
                        backgroundColor: status.isUnlocked ? "#e8f7ee" : "#f1f3f2",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          color: status.isUnlocked ? "#1b5c3f" : "#72837a",
                          fontSize: 10,
                          fontWeight: "800",
                        }}
                      >
                        {status.isUnlocked ? "Obtenida" : "Bloqueada"}
                      </Text>
                    </View>
                  </View>

                  <Text selectable numberOfLines={1} style={{ color: "#56665e", fontSize: 12 }}>
                    {badge.requirementText}
                  </Text>

                  {/* Progress bar */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <View
                      style={{
                        flex: 1,
                        height: 5,
                        borderRadius: 999,
                        backgroundColor: "#e2e8e4",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${status.progressPercent}%`,
                          borderRadius: 999,
                          backgroundColor: status.isUnlocked ? "#28734f" : "#8aa095",
                        }}
                      />
                    </View>
                    <Text style={{ color: "#72837a", fontSize: 10, fontWeight: "800" }}>
                      {new Intl.NumberFormat("es-DO").format(Math.min(status.current, status.target))}/{new Intl.NumberFormat("es-DO").format(status.target)}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: "#97a8a0", fontSize: 16 }}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
        profile={profile}
        visible={Boolean(selectedBadge)}
      />
    </View>
  );
}
