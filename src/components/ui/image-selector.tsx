import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, ScrollView, Text, View } from "react-native";

const PROFILE_IMAGE_BASE_URL =
  "https://mdiprdoemvfwsknnbcox.supabase.co/storage/v1/object/public/imagenesPerfil";

const AVAILABLE_IMAGES = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  url: `${PROFILE_IMAGE_BASE_URL}/${i + 1}.png`,
}));

const palette = {
  background: "#f9f9ff",
  surface: "#ffffff",
  surfaceLow: "#f1f3ff",
  surfaceVariant: "#dce2f7",
  text: "#141b2b",
  textMuted: "#404943",
  outline: "#d1d5db",
  outlineVariant: "#bfc9c1",
  primary: "#2d6a4f",
  primaryDark: "#0f5238",
  primarySoft: "#d8f3dc",
  success: "#52b788",
  tertiary: "#0f4883",
  tertiarySoft: "#d4e3ff",
  error: "#ba1a1a",
  errorSoft: "#ffdad6",
};

interface ImageSelectorProps {
  value: string | null;
  onChange: (imageUrl: string) => void;
  label?: string;
}

export function ImageSelector({
  value,
  onChange,
  label = "Selecciona tu imagen de perfil",
}: ImageSelectorProps) {
  return (
    <View style={{ gap: 10 }}>
      <Text selectable style={{ color: palette.textMuted, fontSize: 12 }}>
        {label}
      </Text>

      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 12,
          paddingBottom: 10,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {AVAILABLE_IMAGES.map((image) => {
            const isSelected = value === image.url;

            return (
              <Pressable
                key={image.id}
                onPress={() => onChange(image.url)}
                style={{
                  position: "relative",
                  borderRadius: 8,
                  overflow: "hidden",
                  borderWidth: isSelected ? 3 : 1,
                  borderColor: isSelected ? palette.primary : palette.outline,
                  backgroundColor: palette.surfaceLow,
                  width: "28%",
                  aspectRatio: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={image.url}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  contentFit="cover"
                />

                {isSelected && (
                  <View
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: palette.primary,
                      borderRadius: 50,
                      padding: 4,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
