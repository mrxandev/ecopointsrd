import { Linking } from "react-native";

import type { RecyclingCenter } from "@/services/recycling-service";

export function hasCoordinates(center: RecyclingCenter) {
  return Number.isFinite(Number(center.latitude)) && Number.isFinite(Number(center.longitude));
}

export function getCenterLocation(center: RecyclingCenter) {
  return [center.municipality, center.province].filter(Boolean).join(", ") || "Ubicacion disponible";
}

export async function openCenterInMaps(center: RecyclingCenter) {
  const query = hasCoordinates(center)
    ? `${Number(center.latitude)},${Number(center.longitude)}`
    : [center.name, center.address, center.municipality, center.province, "Republica Dominicana"]
        .filter(Boolean)
        .join(", ");

  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  await Linking.openURL(url);
}
