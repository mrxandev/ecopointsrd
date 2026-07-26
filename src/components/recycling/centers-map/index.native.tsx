import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

export type MapActivity = {
  id: string;
  kind: "center" | "mission";
  latitude: number;
  location: string;
  longitude: number;
  name: string;
  subtitle: string;
};

export function CentersMap({
  activities,
  focusedActivityId,
}: {
  activities: MapActivity[];
  focusedActivityId?: string | null;
}) {
  const webViewRef = useRef<WebView>(null);
  const [errorHtml, setErrorHtml] = useState<string | null>(null);
  const html = useMemo(
    () => getMapHtml(activities, focusedActivityId),
    [activities, focusedActivityId],
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

function getMapHtml(activities: MapActivity[], focusedActivityId?: string | null) {
  const safeActivities = JSON.stringify(activities).replace(/</g, "\\u003c");
  const safeFocusedActivityId = JSON.stringify(focusedActivityId ?? null).replace(/</g, "\\u003c");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; width: 100%; }
      body { background: #f8eeb6; overflow: hidden; }
      .leaflet-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .activity-marker {
        align-items: center;
        border: 2px solid #fff;
        border-radius: 999px;
        box-shadow: 0 7px 18px rgba(21, 35, 28, 0.22);
        color: #fff;
        display: flex;
        font-size: 15px;
        font-weight: 900;
        height: 30px;
        justify-content: center;
        width: 30px;
      }
      .activity-marker.center { background: #1f7a5a; }
      .activity-marker.mission { background: #2f69b2; }
      .popup-type { color: #2d6a4f; font-size: 11px; font-weight: 800; margin-bottom: 3px; text-transform: uppercase; }
      .popup-title { color: #0b5f46; font-size: 13px; font-weight: 800; margin-bottom: 3px; }
      .popup-location { color: #30483d; font-size: 12px; line-height: 1.35; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      const activities = ${safeActivities};
      const focusedActivityId = ${safeFocusedActivityId};

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

        const map = L.map("map", { tap: true, zoomControl: false }).setView([18.7357, -70.1627], 8);
        window.mapInstance = map;
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
          minZoom: 3
        }).addTo(map);

        const bounds = [];
        const markersById = {};
        activities.forEach((activity) => {
          const point = [activity.latitude, activity.longitude];
          bounds.push(point);
          const marker = L.marker(point, {
            icon: L.divIcon({
              className: "",
              html: '<div class="activity-marker ' + activity.kind + '">' + (activity.kind === "mission" ? "M" : "R") + '</div>',
              iconAnchor: [15, 15],
              popupAnchor: [0, -14]
            })
          }).addTo(map).bindPopup(
            '<div class="popup-type">' + (activity.kind === "mission" ? "Mision" : "Centro de reciclaje") + '</div>' +
            '<div class="popup-title">' + escapeHtml(activity.name) + '</div>' +
            '<div class="popup-location">' + escapeHtml(activity.location || activity.subtitle) + '</div>'
          );
          markersById[activity.id] = marker;
        });

        const focusedMarker = focusedActivityId ? markersById[focusedActivityId] : null;
        if (focusedMarker) {
          map.setView(focusedMarker.getLatLng(), 15, { animate: false });
          focusedMarker.openPopup();
        } else if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [34, 34] });
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
