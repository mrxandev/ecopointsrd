import { Text, View } from "react-native";

export function EmptyTabScreen({ label }: { label: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f7f8fb",
        padding: 24,
      }}
    >
      <Text style={{ color: "#28362f", fontSize: 18, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}
