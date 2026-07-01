import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { type ColorValue, View, useColorScheme } from "react-native";

import { AppTopBarTitle } from "@/components/navigation/app-top-bar-title";

const ACTIVE_COLOR = "#28734f";
const INACTIVE_COLOR = "#34424a";
const BAR_BORDER = "#d7dde0";

export default function AgentTabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <AppTopBarTitle />,
        headerTitleAlign: "center",
        headerShadowVisible: true,
        headerStyle: {
          backgroundColor: isDark ? "#111816" : "#ffffff",
        },
        headerLeft: () => null,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: isDark ? "#d7dde0" : INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: "500",
        },
        tabBarStyle: {
          height: 64,
          paddingTop: 7,
          paddingBottom: 6,
          backgroundColor: isDark ? "#111816" : "#ffffff",
          borderTopColor: isDark ? "#26332f" : BAR_BORDER,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="validar"
        options={{
          title: "Validar",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="validate" />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="profile" />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  color,
  focused,
  name,
}: {
  color: ColorValue;
  focused: boolean;
  name: "validate" | "profile";
}) {
  return (
    <View
      style={{
        width: 64,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        backgroundColor: focused ? ACTIVE_COLOR : "transparent",
      }}
    >
      <IconGlyph name={name} color={focused ? "#ffffff" : color} />
    </View>
  );
}

function IconGlyph({
  color,
  name,
}: {
  color: ColorValue;
  name: "validate" | "profile";
}) {
  const common = { borderColor: color } satisfies ComponentProps<typeof View>["style"];

  if (name === "validate") {
    return (
      <View style={{ width: 23, height: 23, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 20, height: 20, borderWidth: 2, borderRadius: 4, ...common }} />
        <View
          style={{
            position: "absolute",
            width: 11,
            height: 6,
            borderLeftWidth: 2,
            borderBottomWidth: 2,
            transform: [{ rotate: "-45deg" }],
            ...common,
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ width: 22, height: 22, alignItems: "center" }}>
      <View style={{ width: 8, height: 8, borderWidth: 2, borderRadius: 99, ...common }} />
      <View
        style={{
          marginTop: 3,
          width: 16,
          height: 9,
          borderWidth: 2,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderBottomWidth: 0,
          ...common,
        }}
      />
    </View>
  );
}
