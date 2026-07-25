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

  const url = hasCoordinates(center)
    ? `https://www.openstreetmap.org/?mlat=${Number(center.latitude)}&mlon=${Number(center.longitude)}#map=18/${Number(center.latitude)}/${Number(center.longitude)}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;

  await Linking.openURL(url);
}
