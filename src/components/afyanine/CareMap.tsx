"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { CareFacility } from "@/lib/care-data";

export default function CareMap({ centre, facilities, selected, onSelect, onMove }: {
  centre: [number, number]; facilities: CareFacility[]; selected: string | null;
  onSelect: (id: string) => void; onMove: (centre: [number, number]) => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pins = useRef<L.LayerGroup | null>(null);
  const initial = useRef(centre);
  const callbacks = useRef({ onSelect, onMove });
  const [tileError, setTileError] = useState(false);
  useEffect(() => { callbacks.current = { onSelect, onMove }; }, [onSelect, onMove]);
  useEffect(() => {
    if (!node.current) return;
    const instance = L.map(node.current, { scrollWheelZoom: false }).setView(initial.current, 13);
    map.current = instance;
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    tiles.on("tileerror", () => setTileError(true));
    pins.current = L.layerGroup().addTo(instance);
    instance.on("moveend", () => { const p = instance.getCenter(); callbacks.current.onMove([p.lat, p.lng]); });
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(node.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; pins.current = null; };
  }, []);
  useEffect(() => { map.current?.setView(centre, 13); }, [centre]);
  useEffect(() => {
    pins.current?.clearLayers();
    facilities.forEach((facility, index) => {
      const label = document.createElement("span");
      label.textContent = facility.name;
      const marker = L.marker([facility.lat, facility.lng], {
        title: facility.name, alt: facility.name,
        icon: L.divIcon({ className: `care-marker${selected === facility.id ? " selected" : ""}`, html: `<span>${index + 1}</span>`, iconSize: [36, 36], iconAnchor: [18, 36] }),
      }).bindTooltip(label).on("click", () => callbacks.current.onSelect(facility.id));
      marker.addTo(pins.current!);
    });
    const target = facilities.find(f => f.id === selected);
    if (target && map.current && !map.current.getBounds().contains([target.lat, target.lng])) map.current.panTo([target.lat, target.lng]);
  }, [facilities, selected]);
  return <><div ref={node} className="care-leaflet-map" role="region" aria-label="Interactive care map. Drag to pan; use plus and minus to zoom." />{tileError && <p className="map-network-note" role="status">Some map tiles could not load. Facility results remain available below.</p>}</>;
}
