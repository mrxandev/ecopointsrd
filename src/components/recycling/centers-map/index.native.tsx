import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
  const webViewRef = useRef<WebView>(null);
  const [errorHtml, setErrorHtml] = useState<string | null>(null);
  const mapCenters = useMemo(() => getMapCenters(centers), [centers]);
  const html = useMemo(
    () => getMapHtml(mapCenters, focusedCenterId),
    [focusedCenterId, mapCenters],
  );

  const hasLoadError = errorHtml === html;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://www.openstreetmap.org/" }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="never"
        onError={() => setErrorHtml(html)}
        onLoadEnd={() => {
          webViewRef.current?.injectJavaScript(
            "window.mapInstance && window.mapInstance.invalidateSize(false); true;",
          );
        }}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        style={styles.webView}
      />
      {hasLoadError ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>No pudimos abrir el mapa de OpenStreetMap.</Text>
        </View>
      ) : null}
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
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; width: 100%; }
      body { background: #eef4ef; overflow: hidden; }
      .leaflet-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .popup-title { color: #0b5f46; font-size: 13px; font-weight: 800; margin-bottom: 3px; }
      .popup-location { color: #30483d; font-size: 12px; line-height: 1.35; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      const centers = ${safeCenters};
      const focusedCenterId = ${safeFocusedCenterId};

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function createMap() {
        if (!window.L) {
          window.setTimeout(createMap, 100);
          return;
        }

        const map = L.map("map", { tap: true, zoomControl: true }).setView([18.7357, -70.1627], 8);
        window.mapInstance = map;
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
          minZoom: 3
        }).addTo(map);

        const bounds = [];
        const markersById = {};
        centers.forEach((center) => {
          const point = [center.latitude, center.longitude];
          bounds.push(point);
          const marker = L.marker(point).addTo(map).bindPopup(
            '<div class="popup-title">' + escapeHtml(center.name) + '</div>' +
            '<div class="popup-location">' + escapeHtml(center.location) + '</div>'
          );
          markersById[center.id] = marker;
        });

        const focusedMarker = focusedCenterId ? markersById[focusedCenterId] : null;
        if (focusedMarker) {
          map.setView(focusedMarker.getLatLng(), 15, { animate: false });
          focusedMarker.openPopup();
        } else if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [28, 28] });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 14, { animate: false });
        }

        window.setTimeout(() => map.invalidateSize(false), 150);
      }

      createMap();
    </script>
  </body>
</html>`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  error: {
    alignItems: "center",
    backgroundColor: "rgba(244,247,243,0.94)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
    top: 0,
  },
  errorText: {
    color: "#166534",
    fontWeight: "800",
    textAlign: "center",
  },
  webView: {
    flex: 1,
  },
});
