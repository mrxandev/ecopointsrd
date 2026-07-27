import type { UserProfile } from "@/services/user-service";

export type BadgeTone = "green" | "blue" | "gold" | "purple" | "gray";

export type BadgeDefinition = {
  id: string;
  title: string;
  description: string;
  requirementText: string;
  icon: string; // Emoji or short symbol
  tone: BadgeTone;
  category: "Inicio" | "Misiones" | "Puntos";
  targetCount: number;
  getCurrentCount: (profile: UserProfile | null) => number;
};

export const BADGES_CATALOG: BadgeDefinition[] = [
  {
    id: "primeros-pasos",
    title: "Primeros Pasos",
    description: "Te has registrado exitosamente y has iniciado sesión en EcoPoints RD.",
    requirementText: "Crear tu cuenta en EcoPoints RD e iniciar sesión.",
    icon: "🌱",
    tone: "gray",
    category: "Inicio",
    targetCount: 1,
    getCurrentCount: (profile) => (profile ? 1 : 0),
  },
  {
    id: "reforestador",
    title: "Reforestador",
    description: "Has completado tu primera misión ecológica con impacto positivo.",
    requirementText: "Completar al menos 1 misión ecológica.",
    icon: "🌳",
    tone: "green",
    category: "Misiones",
    targetCount: 1,
    getCurrentCount: (profile) => profile?.completed_missions ?? 0,
  },
  {
    id: "reciclador-activo",
    title: "Reciclador Activo",
    description: "Has acumulado 200 puntos o más haciendo la diferencia.",
    requirementText: "Acumular un total de 200 puntos.",
    icon: "♻️",
    tone: "blue",
    category: "Puntos",
    targetCount: 200,
    getCurrentCount: (profile) => profile?.total_points_earned ?? 0,
  },
  {
    id: "heroe-comunitario",
    title: "Héroe Comunitario",
    description: "Demuestra tu compromiso activo participando en múltiples misiones.",
    requirementText: "Completar al menos 3 misiones ecológicas.",
    icon: "🛡️",
    tone: "green",
    category: "Misiones",
    targetCount: 3,
    getCurrentCount: (profile) => profile?.completed_missions ?? 0,
  },
  {
    id: "coleccionista-eco",
    title: "Coleccionista Eco",
    description: "Has demostrado un hábito ecológico constante acumulando 1,000 puntos.",
    requirementText: "Acumular un total de 1,000 puntos.",
    icon: "⭐",
    tone: "gold",
    category: "Puntos",
    targetCount: 1000,
    getCurrentCount: (profile) => profile?.total_points_earned ?? 0,
  },
  {
    id: "leyenda-verde",
    title: "Leyenda Verde",
    description: "Un verdadero referente en la protección de nuestro entorno.",
    requirementText: "Completar 5 misiones ecológicas.",
    icon: "👑",
    tone: "purple",
    category: "Misiones",
    targetCount: 5,
    getCurrentCount: (profile) => profile?.completed_missions ?? 0,
  },
];

export function getBadgeStatus(badge: BadgeDefinition, profile: UserProfile | null) {
  const current = badge.getCurrentCount(profile);
  const target = badge.targetCount;
  const isUnlocked = current >= target;
  const progressPercent = Math.min(100, Math.round((current / target) * 100));

  return {
    current,
    target,
    isUnlocked,
    progressPercent,
  };
}
