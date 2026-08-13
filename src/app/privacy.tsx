import { Stack } from "expo-router";

import { PrivacyScreen } from "@/screens/profile/privacy-screen";

export default function PrivacyRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Políticas Ambientales", headerBackTitle: "Perfil" }} />
      <PrivacyScreen />
    </>
  );
}
