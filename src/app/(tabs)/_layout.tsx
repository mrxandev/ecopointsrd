import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { type ColorValue, View } from "react-native";

import { AppTopBarTitle } from "@/components/navigation/app-top-bar-title";

type TabIconName = "home" | "map" | "missions" | "rewards" | "profile";

const ACTIVE_COLOR = "#2d6a4f";
const INACTIVE_COLOR = "#34424a";
const BAR_BORDER = "#d7dde0";

const TAB_ITEMS: {
  name: string;
  title: string;
  icon: TabIconName;
}[] = [
  { name: "index", title: "Inicio", icon: "home" },
  { name: "mapa", title: "Mapa", icon: "map" },
  { name: "misiones", title: "Misiones", icon: "missions" },
  { name: "recompensas", title: "Recompensas", icon: "rewards" },
  { name: "perfil", title: "Perfil", icon: "profile" },
];

export default function TabsLayout() {
  const isDark = false;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <AppTopBarTitle />,
        headerTitleAlign: "center",
        headerShadowVisible: true,
        headerStyle: {
          backgroundColor: isDark ? "#ffffff" : "#ffffff",
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
          backgroundColor: isDark ? "#ffffff" : "#ffffff",
          borderTopColor: isDark ? "#26332f" : BAR_BORDER,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          gap: 2,
        },
      }}
    >
      {TAB_ITEMS.map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon color={color} focused={focused} name={item.icon} />
            ),
          }}
        />
      ))}
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
  name: TabIconName;
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
  name: TabIconName;
}) {
  const common = { borderColor: color } satisfies ComponentProps<typeof View>["style"];

  if (name === "home") {
    return (
      <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "flex-end" }}>
        <View
          style={{
            position: "absolute",
            top: 2,
            width: 15,
            height: 15,
            borderLeftWidth: 2,
            borderTopWidth: 2,
            transform: [{ rotate: "45deg" }],
            ...common,
          }}
        />
        <View
          style={{
            width: 13,
            height: 12,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderBottomWidth: 2,
            ...common,
          }}
        />
      </View>
    );
  }

  if (name === "map") {
    return (
      <View style={{ width: 24, height: 22, flexDirection: "row" }}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={{
              flex: 1,
              borderWidth: 2,
              borderLeftWidth: index === 0 ? 2 : 0,
              transform: [{ skewY: index === 1 ? "-8deg" : "8deg" }],
              ...common,
            }}
          />
        ))}
      </View>
    );
  }

  if (name === "missions") {
    return (
      <View style={{ width: 22, height: 24, alignItems: "center" }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            width: 9,
            height: 5,
            borderWidth: 2,
            borderBottomWidth: 0,
            borderRadius: 2,
            ...common,
          }}
        />
        <View
          style={{
            marginTop: 4,
            width: 18,
            height: 18,
            borderWidth: 2,
            borderRadius: 2,
            ...common,
          }}
        />
        <View style={{ position: "absolute", top: 10, width: 9, height: 2, backgroundColor: color }} />
        <View style={{ position: "absolute", top: 15, width: 9, height: 2, backgroundColor: color }} />
      </View>
    );
  }

  if (name === "rewards") {
    return (
      <View style={{ width: 24, height: 22, alignItems: "center", justifyContent: "flex-end" }}>
        <View style={{ position: "absolute", top: 0, flexDirection: "row", gap: 2 }}>
          <View style={{ width: 7, height: 7, borderWidth: 2, borderRadius: 99, ...common }} />
          <View style={{ width: 7, height: 7, borderWidth: 2, borderRadius: 99, ...common }} />
        </View>
        <View style={{ width: 22, height: 6, borderWidth: 2, borderRadius: 2, ...common }} />
        <View style={{ width: 18, height: 11, borderWidth: 2, borderTopWidth: 0, ...common }} />
        <View style={{ position: "absolute", bottom: 0, width: 2, height: 16, backgroundColor: color }} />
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

