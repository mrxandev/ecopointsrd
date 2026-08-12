export type ProvinceData = {
  name: string;
  municipalities: string[];
};

export const RD_PROVINCES: ProvinceData[] = [
  {
    name: "Distrito Nacional",
    municipalities: ["Distrito Nacional", "Santo Domingo de Guzmán"],
  },
  {
    name: "Santo Domingo",
    municipalities: [
      "Santo Domingo Este",
      "Santo Domingo Norte",
      "Santo Domingo Oeste",
      "Boca Chica",
      "Los Alcarrizos",
      "Pedro Brand",
      "San Antonio de Guerra",
    ],
  },
  {
    name: "Santiago",
    municipalities: [
      "Santiago de los Caballeros",
      "Tamboril",
      "Puñal",
      "Licey al Medio",
      "San José de las Matas",
      "Villa González",
      "Navarrete",
      "Jánico",
      "Sabana Iglesia",
    ],
  },
  { name: "La Altagracia", municipalities: ["Higüey", "San Rafael del Yuma"] },
  {
    name: "La Romana",
    municipalities: ["La Romana", "Guaymate", "Villa Hermosa"],
  },
  {
    name: "Puerto Plata",
    municipalities: [
      "Puerto Plata",
      "Sosúa",
      "Cabarete",
      "Imbert",
      "Altamira",
      "Luperón",
      "Los Hidalgos",
    ],
  },
  {
    name: "La Vega",
    municipalities: [
      "Concepción de La Vega",
      "Constanza",
      "Jarabacoa",
      "Jima Abajo",
    ],
  },
  {
    name: "San Cristóbal",
    municipalities: [
      "San Cristóbal",
      "Haina",
      "Yaguate",
      "Villa Altagracia",
      "Cambita Garabitos",
      "Los Cacaos",
      "Sabana Grande de Palenque",
    ],
  },
  {
    name: "San Pedro de Macorís",
    municipalities: [
      "San Pedro de Macorís",
      "Consuelo",
      "Quisqueya",
      "San José de los Llanos",
      "Guayacanes",
      "Ramón Santana",
    ],
  },
  {
    name: "Duarte",
    municipalities: [
      "San Francisco de Macorís",
      "Castillo",
      "Pimentel",
      "Las Guáranas",
      "Villa Riva",
      "Arenoso",
      "Eugenio María de Hostos",
    ],
  },
  {
    name: "Espaillat",
    municipalities: [
      "Moca",
      "Gaspar Hernández",
      "Cayetano Germosén",
      "Jamao al Norte",
    ],
  },
  {
    name: "Monseñor Nouel",
    municipalities: ["Bonao", "Maimón", "Piedra Blanca"],
  },
  { name: "Peravia", municipalities: ["Baní", "Nizao", "Matanzas"] },
  {
    name: "Azua",
    municipalities: [
      "Azua de Compostela",
      "Padre Las Casas",
      "Peralta",
      "Sabana Yegua",
      "Estebanía",
      "Guayabal",
      "Las Charcas",
      "Las Yayas de Viajama",
      "Pueblo Viejo",
      "Tábara Arriba",
    ],
  },
  {
    name: "Barahona",
    municipalities: [
      "Barahona",
      "Enriquillo",
      "Cabral",
      "Vicente Noble",
      "El Peñón",
      "Fundación",
      "Jaquimeyes",
      "La Ciénaga",
      "Las Salinas",
      "Paraíso",
      "Polo",
    ],
  },
  { name: "Samaná", municipalities: ["Samaná", "Las Terrenas", "Sánchez"] },
  {
    name: "Sánchez Ramírez",
    municipalities: ["Cotuí", "Fantino", "Cevicos", "La Cueva"],
  },
  {
    name: "Monte Plata",
    municipalities: [
      "Monte Plata",
      "Yamasá",
      "Bayaguana",
      "Sabana Grande de Boyá",
      "Peralvillo",
    ],
  },
  {
    name: "Hermanas Mirabal",
    municipalities: ["Salcedo", "Tenares", "Villa Tapia"],
  },
  {
    name: "María Trinidad Sánchez",
    municipalities: ["Nagua", "Cabrera", "Río San Juan", "El Factor"],
  },
  { name: "Valverde", municipalities: ["Mao", "Esperanza", "Laguna Salada"] },
  {
    name: "Monte Cristi",
    municipalities: [
      "San Fernando de Montecristi",
      "Guayubín",
      "Pepillo Salcedo",
      "Castañuelas",
      "Las Matas de Santa Cruz",
      "Villa Vásquez",
    ],
  },
  {
    name: "Dajabón",
    municipalities: [
      "Dajabón",
      "Loma de Cabrera",
      "Restauración",
      "El Pino",
      "Partido",
    ],
  },
  {
    name: "Santiago Rodríguez",
    municipalities: ["San Ignacio de Sabaneta", "Monción"],
  },
  {
    name: "Hato Mayor",
    municipalities: ["Hato Mayor del Rey", "Sabana de la Mar", "El Valle"],
  },
  { name: "El Seibo", municipalities: ["Santa Cruz de El Seibo", "Miches"] },
  {
    name: "San Juan",
    municipalities: [
      "San Juan de la Maguana",
      "Las Matas de Farfán",
      "El Cercado",
      "Bohechío",
      "Juan de Herrera",
      "Vallejuello",
    ],
  },
  {
    name: "Elías Piña",
    municipalities: [
      "Comendador",
      "Bánica",
      "El Llano",
      "Hondo Valle",
      "Juan Santiago",
      "Pedro Santana",
    ],
  },
  {
    name: "Baoruco",
    municipalities: ["Neiba", "Tamayo", "Galván", "Jaragua", "Villa Jaragua"],
  },
  {
    name: "Independencia",
    municipalities: [
      "Jimaní",
      "Duvergé",
      "La Descubierta",
      "Cristóbal",
      "Mella",
      "Postrer Río",
    ],
  },
  { name: "Pedernales", municipalities: ["Pedernales", "Oviedo"] },
  {
    name: "San José de Ocoa",
    municipalities: ["San José de Ocoa", "Sabana Larga", "Rancho Arriba"],
  },
];

export const ALL_PROVINCE_NAMES = RD_PROVINCES.map((p) => p.name);

export function getMunicipalitiesForProvince(provinceName?: string): string[] {
  if (!provinceName || !provinceName.trim()) {
    return [];
  }
  const clean = provinceName.trim().toLowerCase();
  const found = RD_PROVINCES.find(
    (p) =>
      p.name.toLowerCase() === clean ||
      p.name.toLowerCase().includes(clean) ||
      clean.includes(p.name.toLowerCase()),
  );
  if (found && found.municipalities.length > 0) {
    return found.municipalities;
  }
  return [];
}
