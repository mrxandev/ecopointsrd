import { Text, View } from "react-native";

export function AppTopBarTitle() {
  const isDark = false;

  return (
    <View
      style={{
        minWidth: 140,
        minHeight: 28,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
      }}
    >
      <BrandLeaf />
      <Text
        style={{
          color: isDark ? "#f3fbf6" : "#141b2b",
          fontSize: 13,
          fontWeight: "800",
          lineHeight: 18,
        }}
      >
        EcoPoints RD
      </Text>
    </View>
  );
}

function BrandLeaf() {
  return (
    <View
      style={{
        width: 13,
        height: 13,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 10,
          height: 13,
          borderTopLeftRadius: 9,
          borderTopRightRadius: 2,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 9,
          backgroundColor: "#2d6a4f",
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 8,
          height: 1.5,
          borderRadius: 99,
          backgroundColor: "#ffffff",
          transform: [{ rotate: "-35deg" }],
        }}
      />
    </View>
  );
}

