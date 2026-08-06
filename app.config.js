const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    "expo-font",
    "expo-image",
    "expo-web-browser",
  ],
});
