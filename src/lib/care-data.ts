export type CareCategory = "Hospital" | "Clinic" | "Pharmacy" | "Ambulance";
export interface CareFacility {
  id: string; name: string; lat: number; lng: number; category: CareCategory;
  address: string; hours: string | null; phone: string | null;
  maternity: boolean; alwaysOpen: boolean; sourceUrl: string;
}
interface OsmElement {
  type: string; id: number; lat?: number; lon?: number;
  center?: { lat: number; lon: number }; tags?: Record<string, string>;
}
export function normalizeFacilities(elements: OsmElement[]): CareFacility[] {
  return elements.flatMap(element => {
    const tags = element.tags ?? {};
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (!tags.name || typeof lat !== "number" || typeof lng !== "number" ||
      !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180 ||
      !["node", "way", "relation"].includes(element.type) || !Number.isSafeInteger(element.id)) return [];
    const category: CareCategory | null = tags.emergency === "ambulance_station" ? "Ambulance" :
      tags.amenity === "hospital" ? "Hospital" : tags.amenity === "pharmacy" ? "Pharmacy" :
      ["clinic", "doctors"].includes(tags.amenity) ? "Clinic" : null;
    if (!category) return [];
    return [{
      id: `${element.type}/${element.id}`, name: tags.name.slice(0, 160), lat, lng, category,
      address: [tags["addr:street"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", ").slice(0, 200),
      hours: tags.opening_hours?.slice(0, 100) ?? null,
      phone: (tags["contact:phone"] ?? tags.phone)?.slice(0, 80) ?? null,
      maternity: /matern|obstetric|gynaecolog|gynecolog/i.test(tags["healthcare:speciality"] ?? ""),
      alwaysOpen: tags.opening_hours === "24/7",
      sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    }];
  });
}
export function distanceKm(a: readonly number[], b: readonly number[]): number {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function directionsUrl(facility: Pick<CareFacility, "lat" | "lng">): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
}
