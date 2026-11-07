import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFacilities, distanceKm, directionsUrl } from "../src/lib/care-data.ts";

const hospital = { type: "node", id: 1, lat: -1.29, lon: 36.82, tags: { name: "Fictional fixture hospital", amenity: "hospital" } };
test("public facility normalization preserves unknown hours, not a fake open status", () => {
  const [facility] = normalizeFacilities([hospital]);
  assert.equal(facility.category, "Hospital");
  assert.equal(facility.hours, null);
  assert.equal(facility.alwaysOpen, false);
  assert.equal(facility.maternity, false);
  assert.equal(facility.sourceUrl, "https://www.openstreetmap.org/node/1");
});
test("way centres, listed maternity, phone and 24/7 tags are supported", () => {
  const [facility] = normalizeFacilities([{ type: "way", id: 2, center: { lat: -1.3, lon: 36.8 }, tags: { amenity: "clinic", name: "Fixture clinic", opening_hours: "24/7", "healthcare:speciality": "obstetrics", "contact:phone": "+254000000000" } }]);
  assert.equal(facility.category, "Clinic");
  assert.equal(facility.maternity, true);
  assert.equal(facility.alwaysOpen, true);
  assert.equal(facility.phone, "+254000000000");
});
test("unnamed, unrelated and invalid-coordinate features are excluded", () => {
  assert.deepEqual(normalizeFacilities([
    { ...hospital, tags: { amenity: "hospital" } },
    { ...hospital, lat: NaN }, { ...hospital, lon: 181 },
    { ...hospital, type: "javascript:alert" },
    { ...hospital, tags: { name: "Fixture cafe", amenity: "cafe" } },
  ]), []);
});
test("source names stay text and URL construction cannot inject a provider URL", () => {
  const [facility] = normalizeFacilities([{ ...hospital, tags: { ...hospital.tags, name: "<img onerror=alert(1)>" } }]);
  assert.equal(facility.name, "<img onerror=alert(1)>");
  assert.equal(facility.sourceUrl, "https://www.openstreetmap.org/node/1");
  assert.equal(new URL(directionsUrl(facility)).searchParams.get("destination"), "-1.29,36.82");
});
test("distances are straight-line and do not invent travel times", () => {
  assert.equal(distanceKm([0, 0], [0, 0]), 0);
  assert.ok(Math.abs(distanceKm([0, 0], [0, 1]) - 111.195) < .01);
});
