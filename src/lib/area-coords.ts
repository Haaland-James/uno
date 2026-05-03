// Approximate coords (lng, lat) keyed by city and "City|Area".
// Shared between the seed (prisma/seed.ts) and the API mapper, so any
// listing without explicit lat/lng still falls onto the search map.

export const CITY_COORDS: Record<string, [number, number]> = {
  Uyo: [7.928, 5.040],
  Lagos: [3.380, 6.524],
  Abuja: [7.490, 9.058],
  "Port Harcourt": [7.013, 4.815],
  Calabar: [8.323, 4.957],
  Eket: [7.929, 4.642],
};

// Area key format: "City|Area" — must match the seed/listing rows.
export const AREA_COORDS: Record<string, [number, number]> = {
  // Uyo
  "Uyo|Aka Etinan Road": [7.929, 5.040],
  "Uyo|Ikpa Road": [7.918, 5.058],
  "Uyo|Itam": [7.926, 5.085],
  "Uyo|Ewet Housing": [7.913, 5.041],
  "Uyo|Osongama Housing Estate": [7.911, 5.037],
  "Uyo|Nwaniba": [7.985, 5.068],
  "Uyo|Nwaniba Road": [7.960, 5.060],
  "Uyo|Calabar Itu": [7.970, 5.070],
  "Uyo|Oron Road": [7.945, 5.005],
  "Uyo|Shelter Afrique": [7.935, 5.025],
  "Uyo|Abak Road": [7.910, 5.010],
  "Uyo|Aka Road": [7.930, 5.040],
  "Uyo|Four Lanes": [7.920, 5.038],
  "Uyo|Ikot Ekpene Road": [7.890, 5.030],
  "Uyo|Independence Layout": [7.925, 5.045],
  "Uyo|Ring Road": [7.928, 5.030],
  "Uyo|Udo Udoma Avenue": [7.923, 5.043],
  "Uyo|Uruan": [8.040, 5.020],
  "Uyo|Use-Offot": [7.940, 5.020],
  "Uyo|Ediene Abak Road": [7.880, 5.000],
  // Lagos
  "Lagos|Lekki Phase 1": [3.471, 6.443],
  "Lagos|Lekki Phase 2": [3.534, 6.435],
  "Lagos|Lekki County": [3.580, 6.470],
  "Lagos|Ikoyi": [3.435, 6.450],
  "Lagos|Chevron Drive": [3.547, 6.444],
  "Lagos|Sangotedo": [3.700, 6.471],
  "Lagos|Victoria Island": [3.422, 6.428],
  "Lagos|Ikeja GRA": [3.350, 6.583],
  // Abuja
  "Abuja|Wuse 2": [7.477, 9.080],
  "Abuja|Wuse Market": [7.475, 9.075],
  "Abuja|Maitama": [7.493, 9.087],
  "Abuja|Asokoro": [7.530, 9.044],
  "Abuja|Kado": [7.450, 9.110],
  "Abuja|Lugbe": [7.405, 8.945],
  "Abuja|Gwarinpa": [7.420, 9.120],
  // Port Harcourt
  "Port Harcourt|GRA Phase 2": [7.020, 4.834],
  "Port Harcourt|Trans Amadi Industrial Layout": [7.030, 4.820],
  // Calabar
  "Calabar|State Housing Estate": [8.330, 4.960],
  "Calabar|Watt Market": [8.323, 4.953],
  // Eket
  "Eket|Marina": [7.918, 4.643],
};

/** Reproducible per-row jitter (~±400m) so identical-area pins don't stack. */
export function coordsFor(
  city: string,
  area: string,
  salt: number
): { lat: number; lng: number } {
  const base =
    AREA_COORDS[`${city}|${area}`] ??
    CITY_COORDS[city] ??
    CITY_COORDS.Uyo;
  let s = (salt * 2654435761) >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const jitter = 0.004; // ≈ 400–450m
  return {
    lng: base[0] + (rand() - 0.5) * 2 * jitter,
    lat: base[1] + (rand() - 0.5) * 2 * jitter,
  };
}

/** City-center fallback for listings missing lat/lng entirely. */
export function fallbackCoordsFor(
  city: string | null | undefined,
  area: string | null | undefined,
  salt: number
): { lat: number; lng: number } | null {
  if (!city) return null;
  const base = AREA_COORDS[`${city}|${area ?? ""}`] ?? CITY_COORDS[city];
  if (!base) return null;
  return coordsFor(city, area ?? "", salt);
}
