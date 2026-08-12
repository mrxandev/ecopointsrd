import {
    ALL_PROVINCE_NAMES,
    getMunicipalitiesForProvince,
} from "@/data/rdGeography";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

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

interface SelectDropdownProps {
  label: string;
  value: string;
  onSelect: (value: string) => void;
  options: string[];
  placeholder: string;
  icon?: string;
  disabled?: boolean;
}

export function SelectDropdown({
  label,
  value,
  onSelect,
  options,
  placeholder,
  icon,
  disabled = false,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchText.toLowerCase()),
  );

  const displayValue = value || placeholder;

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 4,
        }}
      >
        {icon && (
          <Ionicons name={icon as any} size={14} color={palette.primary} />
        )}
        <Text
          style={{
            color: palette.textMuted,
            fontSize: 11,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      </View>

      <Pressable
        disabled={disabled}
        onPress={() => !disabled && setIsOpen(true)}
        style={{
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: palette.surfaceVariant,
          backgroundColor: disabled ? palette.surfaceLow : palette.surface,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(20, 27, 43, 0.08)",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text
          style={{
            color:
              displayValue === placeholder ? palette.textMuted : palette.text,
            fontSize: 14,
            fontFamily: "System",
          }}
        >
          {displayValue}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={palette.primary}
        />
      </Pressable>

      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
            }}
            onPress={() => setIsOpen(false)}
          >
            <View
              style={{
                backgroundColor: palette.surface,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: "80%",
                paddingTop: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: palette.text,
                  }}
                >
                  Seleccionar {label}
                </Text>
                <Pressable
                  onPress={() => setIsOpen(false)}
                  style={{
                    padding: 8,
                    borderRadius: 999,
                    backgroundColor: palette.surfaceLow,
                  }}
                >
                  <Ionicons name="close" size={20} color={palette.text} />
                </Pressable>
              </View>

              <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                <TextInput
                  placeholder={`Buscar ${label.toLowerCase()}...`}
                  placeholderTextColor={palette.textMuted}
                  value={searchText}
                  onChangeText={setSearchText}
                  style={{
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: palette.outline,
                    backgroundColor: palette.surfaceLow,
                    color: palette.text,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                  }}
                />
              </View>

              <ScrollView
                style={{ maxHeight: "70%" }}
                showsVerticalScrollIndicator={false}
              >
                {filteredOptions.length === 0 ? (
                  <View
                    style={{
                      padding: 16,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: palette.textMuted,
                        fontSize: 14,
                      }}
                    >
                      No se encontraron resultados
                    </Text>
                  </View>
                ) : (
                  filteredOptions.map((option, index) => (
                    <Pressable
                      key={option + index}
                      onPress={() => {
                        onSelect(option);
                        setIsOpen(false);
                        setSearchText("");
                      }}
                      style={({ pressed }) => ({
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        backgroundColor:
                          value === option
                            ? palette.primarySoft
                            : pressed
                              ? palette.surfaceLow
                              : palette.surface,
                        borderBottomWidth: 1,
                        borderBottomColor: palette.outline,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      })}
                    >
                      <Text
                        style={{
                          color:
                            value === option ? palette.primary : palette.text,
                          fontSize: 14,
                          fontWeight: value === option ? "700" : "500",
                        }}
                      >
                        {option}
                      </Text>
                      {value === option && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={palette.primary}
                        />
                      )}
                    </Pressable>
                  ))
                )}
              </ScrollView>

              <View style={{ height: 16 }} />
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

interface ProvinceSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

export function ProvinceSelect({
  value,
  onChange,
  disabled = false,
  label = "Provincia",
}: ProvinceSelectProps) {
  return (
    <SelectDropdown
      label={label}
      value={value}
      onSelect={onChange}
      options={ALL_PROVINCE_NAMES}
      placeholder="Seleccionar provincia..."
      icon="location-outline"
      disabled={disabled}
    />
  );
}

interface MunicipalitySelectProps {
  value: string;
  onChange: (value: string) => void;
  province?: string;
  disabled?: boolean;
  label?: string;
}

export function MunicipalitySelect({
  value,
  onChange,
  province,
  disabled = false,
  label = "Municipio",
}: MunicipalitySelectProps) {
  const municipalities = getMunicipalitiesForProvince(province);
  const isPendingProvince = !province || !province.trim();
  const isDisabled = disabled || isPendingProvince;

  const displayLabel = isPendingProvince
    ? "Selecciona una provincia primero"
    : municipalities.length > 0
      ? "Seleccionar municipio..."
      : "No hay municipios disponibles";

  return (
    <SelectDropdown
      label={label}
      value={isPendingProvince ? "" : value}
      onSelect={onChange}
      options={municipalities}
      placeholder={displayLabel}
      icon="location-outline"
      disabled={isDisabled}
    />
  );
}
