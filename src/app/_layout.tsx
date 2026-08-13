import { useRouter, useSegments } from "expo-router";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { Stack } from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { BackHandler, Platform, StatusBar as NativeStatusBar } from "react-native";

import { AppTopBarTitle } from "@/components/navigation/app-top-bar-title";
import { MissionBackButton } from "@/components/navigation/mission-back-button";
import { AuthProvider } from "@/context/auth-context";
import { useAuth } from "@/hooks/use-auth";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <NativeStatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <ExpoStatusBar style="dark" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const routeGroup = segments[0];
    const isAuthRoute = routeGroup === "(auth)";
    const isAgentRoute = routeGroup === "(agent)";
    const isUserRoute = routeGroup === "(tabs)";
    const isMissionRoute = routeGroup === "mission";
    const isRecyclingCenterRoute = routeGroup === "recycling-center";
    const isChangePasswordRoute = routeGroup === "change-password";
    const isPointHistoryRoute = routeGroup === "point-history";
    const isRankingRoute = routeGroup === "ranking";
    const isBadgesRoute = routeGroup === "badges";
    const isPrivacyRoute = routeGroup === "privacy";

    if (!isAuthenticated) {
      if (!isAuthRoute) {
        router.replace("/login");
      }

      return;
    }

    if (
      role === "USER" &&
      !isUserRoute &&
      !isMissionRoute &&
      !isRecyclingCenterRoute &&
      !isChangePasswordRoute &&
      !isPointHistoryRoute &&
      !isRankingRoute &&
      !isBadgesRoute &&
      !isPrivacyRoute
    ) {
      router.replace("/");
      return;
    }

    if (
      (role === "AGENT" || role === "ADMIN") &&
      !isAgentRoute &&
      !isChangePasswordRoute &&
      !isPrivacyRoute
    ) {
      router.replace("/validar");
    }
  }, [isAuthenticated, isLoading, role, router, segments]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(agent)" />
      <Stack.Screen
        name="change-password"
        options={{
          headerShown: true,
          headerTitle: () => <AppTopBarTitle />,
          headerTitleAlign: "center",
          headerLeft: () => <MissionBackButton />,
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="point-history"
        options={{
          headerShown: true,
          headerTitle: () => <AppTopBarTitle />,
          headerTitleAlign: "center",
          headerLeft: () => <MissionBackButton />,
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="ranking"
        options={{
          headerShown: true,
          headerTitle: () => <AppTopBarTitle />,
          headerTitleAlign: "center",
          headerLeft: () => <MissionBackButton />,
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="badges"
        options={{
          headerShown: true,
          headerTitle: () => <AppTopBarTitle />,
          headerTitleAlign: "center",
          headerLeft: () => <MissionBackButton />,
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="recycling-center/[id]"
        options={{
          headerShown: true,
          headerTitle: () => <AppTopBarTitle />,
          headerTitleAlign: "center",
          headerLeft: () => <MissionBackButton />,
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="mission/[id]"
        options={{
          headerShown: true,
          headerTitle: () => <AppTopBarTitle />,
          headerTitleAlign: "center",
          headerLeft: () => <MissionBackButton />,
          headerShadowVisible: true,
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          headerShown: true,
          headerTitle: () => <AppTopBarTitle />,
          headerTitleAlign: "center",
          headerLeft: () => <MissionBackButton />,
          headerShadowVisible: true,
        }}
      />
    </Stack>
  );
}
