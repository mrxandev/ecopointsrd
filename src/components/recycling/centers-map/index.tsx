import { Text, View } from "react-native";

import type { RecyclingCenter } from "@/services/recycling-service";

export function CentersMap({
  centers,
}: {
  centers: RecyclingCenter[];
  focusedCenterId?: string | null;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#d8f3dc",
        padding: 20,
      }}
    >
      <Text selectable style={{ color: "#166534", fontWeight: "900", textAlign: "center" }}>
        Mapa disponible en iOS y Android
      </Text>
      <Text selectable style={{ color: "#2d6a4f", marginTop: 6, textAlign: "center" }}>
        {centers.length} centros con coordenadas listas para ubicarse.
      </Text>
    </View>
  );
}

