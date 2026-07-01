import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { useRouter, useSegments } from "expo-router";
import { Stack } from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { AuthProvider } from "@/context/auth-context";
import { useAuth } from "@/hooks/use-auth";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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

    if (!isAuthenticated) {
      if (!isAuthRoute) {
        router.replace("/login");
      }

      return;
    }

    if (role === "USER" && !isUserRoute) {
      router.replace("/");
      return;
    }

    if ((role === "AGENT" || role === "ADMIN") && !isAgentRoute) {
      router.replace("/validar");
    }
  }, [isAuthenticated, isLoading, role, router, segments]);

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
    </Stack>
  );
}
