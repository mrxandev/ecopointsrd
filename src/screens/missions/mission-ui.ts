import type { Mission } from "@/services/mission-service";

export const MISSION_IMAGES = [
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80",
];

export function getMissionImage(missionId: string) {
  const index = missionId
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return MISSION_IMAGES[index % MISSION_IMAGES.length];
}

export function formatMissionDate(value: string | null) {
  if (!value) {
    return "Fecha flexible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha flexible";
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function getMissionLocation(mission: Mission) {
  return [mission.municipality, mission.province].filter(Boolean).join(", ") || "Ubicacion abierta";
}

export function getMissionRequirements(mission: Mission) {
  const requirements = [];

  if (mission.requires_evidence) {
    requirements.push("Evidencia requerida");
  }

  if (mission.requires_qr_validation) {
    requirements.push("Validacion QR");
  }

  if (mission.requires_approval) {
    requirements.push("Aprobacion requerida");
  }

  return requirements.length > 0 ? requirements : ["Inscripcion directa"];
}
