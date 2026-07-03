import { View } from "react-native";
import { WebView } from "react-native-webview";

import { getCenterLocation } from "@/screens/recycling/recycling-utils";
import type { RecyclingCenter } from "@/services/recycling-service";

type MapCenter = {
  id: string;
  latitude: number;
  location: string;
  longitude: number;
  name: string;
};

export function CentersMap({
  centers,
  focusedCenterId,
}: {
  centers: RecyclingCenter[];
  focusedCenterId?: string | null;
}) {
  const mapCenters = getMapCenters(centers);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        domStorageEnabled
        javaScriptEnabled
        originWhitelist={["*"]}
        nestedScrollEnabled
        overScrollMode="never"
        scalesPageToFit={false}
        source={{ html: getMapHtml(mapCenters, focusedCenterId) }}
        startInLoadingState
        style={{ flex: 1, backgroundColor: "#eef4ef" }}
      />
    </View>
  );
}

function getMapCenters(centers: RecyclingCenter[]): MapCenter[] {
  return centers
    .map((center) => ({
      id: center.id,
      latitude: Number(center.latitude),
      location: getCenterLocation(center),
      longitude: Number(center.longitude),
      name: center.name,
    }))
    .filter(
      (center) => Number.isFinite(center.latitude) && Number.isFinite(center.longitude),
    );
}

function getMapHtml(centers: MapCenter[], focusedCenterId?: string | null) {
  const safeCenters = JSON.stringify(centers).replace(/</g, "\\u003c");
  const safeFocusedCenterId = JSON.stringify(focusedCenterId ?? null).replace(/</g, "\\u003c");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIINfQhtHr6e+0tDiZtdEaQ+4v0gb7F4fb4="
      crossorigin=""
    />
    <style>
      html,
      body,
      #map {
        height: 100%;
        margin: 0;
        overflow: hidden;
        touch-action: none;
        width: 100%;
      }

      body {
        background: #eef4ef;
      }

      .leaflet-container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .popup-title {
        color: #0b5f46;
        font-size: 13px;
        font-weight: 800;
        margin-bottom: 3px;
      }

      .popup-location {
        color: #30483d;
        font-size: 12px;
        line-height: 1.35;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      const centers = ${safeCenters};
      const focusedCenterId = ${safeFocusedCenterId};
      const map = L.map("map", {
        attributionControl: true,
        dragging: true,
        tap: true,
        touchZoom: true,
        zoomControl: true
      }).setView([18.7357, -70.1627], 8);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
      }).addTo(map);

      const bounds = [];
      const markersById = {};

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      centers.forEach((center) => {
        const point = [center.latitude, center.longitude];
        bounds.push(point);
        const marker = L.marker(point)
          .addTo(map)
          .bindPopup(
            '<div class="popup-title">' +
              escapeHtml(center.name) +
              '</div><div class="popup-location">' +
              escapeHtml(center.location) +
              "</div>"
          );
        markersById[center.id] = marker;
      });

      const focusedMarker = focusedCenterId ? markersById[focusedCenterId] : null;

      if (focusedMarker) {
        const point = focusedMarker.getLatLng();
        map.setView(point, 15, { animate: false });
        focusedMarker.openPopup();
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [28, 28] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      }
    </script>
  </body>
</html>`;
}
