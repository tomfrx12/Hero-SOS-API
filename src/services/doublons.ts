import { prisma } from "./prisma";

// Rayon (en mètres) dans lequel deux incidents ouverts sont considérés comme des doublons
const RAYON_DOUBLON = 200;
const RAYON_TERRE = 6_371_000;

function distanceEnMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degres: number) => (degres * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE * Math.asin(Math.sqrt(a));
}

export async function trouverDoublons(latitude: number, longitude: number, idExclu?: number) {
  // Pré-filtre en base sur un carré autour du point, puis calcul exact de la distance
  const ecartLat = RAYON_DOUBLON / 111_000;
  const ecartLon = RAYON_DOUBLON / (111_000 * Math.cos((latitude * Math.PI) / 180));

  const candidats = await prisma.incident.findMany({
    where: {
      id: idExclu ? { not: idExclu } : undefined,
      status: { in: ["Signale", "En_Cours"] },
      latitude: { gte: latitude - ecartLat, lte: latitude + ecartLat },
      longitude: { gte: longitude - ecartLon, lte: longitude + ecartLon },
    },
  });

  return candidats
    .map((incident) => ({
      ...incident,
      distance: Math.round(distanceEnMetres(latitude, longitude, incident.latitude, incident.longitude)),
    }))
    .filter((incident) => incident.distance <= RAYON_DOUBLON)
    .sort((a, b) => a.distance - b.distance);
}
