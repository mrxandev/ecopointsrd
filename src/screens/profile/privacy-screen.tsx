import { ScrollView, Text, View } from "react-native";

const palette = {
  background: "#f9f9ff",
  surface: "#ffffff",
  text: "#141b2b",
  textMuted: "#404943",
  primary: "#2d6a4f",
  outline: "#d1d5db",
};

export function PrivacyScreen() {
  const isDark = false;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? "#f9f9ff" : palette.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 24 }}
    >
      <View style={{ gap: 8 }}>
        <Text style={{ color: palette.primary, fontSize: 24, fontWeight: "900" }}>
          Políticas Ambientales y Privacidad
        </Text>
        <Text style={{ color: palette.textMuted, fontSize: 14, lineHeight: 20 }}>
          En EcoPoints RD estamos comprometidos con la reforestación y el cuidado de nuestro medio ambiente. 
          Al participar en nuestras misiones, aceptas los siguientes términos y condiciones para proteger la biodiversidad.
        </Text>
      </View>

      <Section 
        title="1. Protección de Especies Nativas" 
        content="Queda estrictamente prohibida la plantación de especies invasoras durante las misiones de EcoPoints RD. Los usuarios deben asegurarse de plantar exclusivamente flora nativa o endémica correspondiente al ecosistema de la zona de la misión."
      />

      <Section 
        title="2. Cumplimiento de la Ley 64-00" 
        content="Todas las actividades realizadas por los usuarios deben apegarse a la Ley General sobre Medio Ambiente y Recursos Naturales (Ley 64-00) de la República Dominicana. No se debe incurrir en deforestación, alteración de ecosistemas vulnerables, ni contaminación de cuerpos de agua bajo el pretexto de cumplir una misión."
      />

      <Section 
        title="3. Zonas Protegidas y Propiedad Privada" 
        content="Los usuarios no deben ingresar a propiedades privadas sin autorización ni realizar plantaciones en Áreas Protegidas Nacionales sin el consentimiento de las autoridades del Ministerio de Medio Ambiente."
      />

      <Section 
        title="4. Exención de Responsabilidad" 
        content="EcoPoints RD opera únicamente como una plataforma de gamificación para incentivar prácticas ecológicas. No nos hacemos responsables civil ni penalmente por infracciones, daños a terceros, daños a la propiedad, o violaciones a las leyes ambientales dominicanas cometidas por los usuarios durante el transcurso de las misiones."
      />

      <Section 
        title="5. Privacidad de los Datos" 
        content="Tus datos personales, ubicación y fotos de validación de misiones solo se utilizarán para validar los puntos dentro de la plataforma y no serán compartidos con terceros sin tu consentimiento explícito."
      />

      <View style={{ marginTop: 20, padding: 16, backgroundColor: "#fff3cd", borderRadius: 8, borderWidth: 1, borderColor: "#ffeeba" }}>
        <Text style={{ color: "#856404", fontSize: 13, fontWeight: "700", textAlign: "center" }}>
          Al utilizar EcoPoints RD, confirmas que has leído y aceptas nuestra política de exención de responsabilidad y te comprometes a cuidar el medio ambiente de forma responsable.
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: palette.text, fontSize: 16, fontWeight: "800" }}>{title}</Text>
      <Text style={{ color: palette.textMuted, fontSize: 14, lineHeight: 22 }}>{content}</Text>
    </View>
  );
}
