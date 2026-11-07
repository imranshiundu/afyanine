"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../Icon";
import { BottomNav, Header } from "../chrome";
import { directionsUrl, distanceKm, type CareFacility, type CareCategory } from "@/lib/care-data";
import type { Screen } from "../data";

const CareMap = dynamic(() => import("../CareMap"), { ssr: false, loading: () => <p className="care-loading">Loading interactive map…</p> });
const NAIROBI: [number, number] = [-1.2921, 36.8219];
const CATEGORIES = ["All", "Hospital", "Clinic", "Pharmacy", "Ambulance"] as const;
export function FindCare({ navigate, onProfile, chw = false }: { navigate: (screen: Screen) => void; onProfile: () => void; chw?: boolean }) {
  const [centre, setCentre] = useState<[number, number]>(NAIROBI);
  const [mapCentre, setMapCentre] = useState<[number, number]>(NAIROBI);
  const [locationLabel, setLocationLabel] = useState("Nairobi centre · not your location");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [category, setCategory] = useState<"All" | CareCategory>("All");
  const [view, setView] = useState<"Map" | "List">("Map");
  const [large, setLarge] = useState(false);
  const [search, setSearch] = useState("");
  const [maternity, setMaternity] = useState(false);
  const [always, setAlways] = useState(false);
  const [data, setData] = useState<CareFacility[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fetchedAt, setFetchedAt] = useState("");
  const [retry, setRetry] = useState(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/care", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat: Number(centre[0].toFixed(3)), lng: Number(centre[1].toFixed(3)) }), signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Facility directory unavailable.");
        return body;
      }).then(body => { if (!controller.signal.aborted) { setData(body.facilities); setFetchedAt(body.fetchedAt); setLoading(false); } })
      .catch(error => { if (!controller.signal.aborted) { setError(error instanceof Error ? error.message : "Directory unavailable."); setLoading(false); } });
    return () => controller.abort();
  }, [centre, retry]);
  const facilities = useMemo(() => data.filter(f => (category === "All" || f.category === category) &&
    (!maternity || f.maternity) && (!always || f.alwaysOpen) &&
    `${f.name} ${f.address}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => distanceKm(centre, [a.lat, a.lng]) - distanceKm(centre, [b.lat, b.lng])), [data, category, maternity, always, search, centre]);
  const selected = facilities.find(f => f.id === selectedId) ?? facilities[0] ?? null;
  const loadArea = (point: [number, number], label: string) => {
    setLoading(true); setError(""); setData([]); setSelectedId(null); setFetchedAt("");
    setCentre(point); setLocationLabel(label); setRetry(value => value + 1);
  };
  const locate = () => {
    if (!navigator.geolocation) { setLocationError("Location is not supported. Pan the map and search that area instead."); return; }
    setLocating(true); setLocationError("");
    navigator.geolocation.getCurrentPosition(position => {
      if (!alive.current) return;
      setLocating(false);
      loadArea([Number(position.coords.latitude.toFixed(3)), Number(position.coords.longitude.toFixed(3))], "Near your approximate location");
    }, () => {
      if (!alive.current) return;
      setLocating(false); setLocationError("Location was unavailable or denied. You can still pan the map and search any area.");
    }, { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false });
  };
  const details = (facility: CareFacility) => <div className="care-selected-details">
    <span className="eyebrow">{facility.category} · {(distanceKm(centre, [facility.lat, facility.lng])).toFixed(1)} km straight-line</span>
    <h3>{facility.name}</h3><p>{facility.address || "Address not listed"}</p>
    <p>{facility.hours ? `Hours listed: ${facility.hours}` : "Opening hours unknown · call ahead"}</p>
    <div className="care-detail-actions"><a className="care-directions" href={directionsUrl(facility)} target="_blank" rel="noopener noreferrer"><Icon name="direction" size={16} />Directions</a>
      {facility.phone && /^[+\d\s()-]+$/.test(facility.phone) && <a href={`tel:${facility.phone.replace(/[^\d+]/g, "")}`}><Icon name="phone" size={16} />Call</a>}
      <a href={facility.sourceUrl} target="_blank" rel="noopener noreferrer">Source</a>
    </div>
  </div>;
  return <main className="screen with-nav care-screen care-discovery">
    <Header title="Find care" onBack={() => navigate(chw ? "chw" : "home")} />
    <div className="care-location-row"><p><b>Care around you</b><small>{locationLabel}</small></p><button className="icon-button" onClick={locate} disabled={locating} aria-label="Use my location"><Icon name="pin" />{locating && <span className="sr-only">Locating</span>}</button></div>
    <p className="care-privacy">Use my location shares an approximate area with map providers to find care. It is not saved to your profile.</p>
    {locationError && <p className="account-error" role="status">{locationError}</p>}
    <label className="care-search"><Icon name="search" size={18} /><input aria-label="Search facilities" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter names in these results" /></label>
    <div className="care-category-tabs" role="group" aria-label="Facility type">{CATEGORIES.map(item => <button key={item} aria-pressed={category === item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="care-view-controls"><div role="group" aria-label="Map or list view">{(["Map", "List"] as const).map(item => <button aria-pressed={view === item} className={view === item ? "active" : ""} key={item} onClick={() => setView(item)}>{item}</button>)}</div>{view === "Map" && <button onClick={() => setLarge(!large)} aria-pressed={large}>{large ? "Compact map" : "Larger map"}</button>}</div>
    {view === "Map" && <div className={`care-map-frame${large ? " expanded" : ""}`}><CareMap centre={centre} facilities={facilities} selected={selected?.id ?? null} onSelect={setSelectedId} onMove={setMapCentre} />
      {distanceKm(centre, mapCentre) > .3 && <button className="search-map-area" onClick={() => loadArea(mapCentre, "Selected map area")}>Search this area</button>}
    </div>}
    <div className="care-filter-checks"><label><input type="checkbox" checked={maternity} onChange={e => setMaternity(e.target.checked)} />Maternity listed</label><label><input type="checkbox" checked={always} onChange={e => setAlways(e.target.checked)} />24/7 listed</label></div>
    {loading ? <p className="care-loading" role="status">Looking up public facility data…</p> : error ? <section className="care-provider-error" role="status"><b>Directory connection unavailable</b><p>{error}</p><button className="secondary-button" onClick={() => loadArea(centre, locationLabel)}>Retry directory</button></section> : <>
      <p className="care-result-count">{facilities.length} mapped places · within 8 km of search centre</p>
      {selected && view === "Map" && <section className="care-selected-card" aria-label="Selected facility">{details(selected)}</section>}
      {view === "List" && <div className="care-real-list">{facilities.map((facility, index) => <section key={facility.id} className="care-selected-card"><button className="facility-select" onClick={() => { setSelectedId(facility.id); setView("Map"); }} aria-label={`Show ${facility.name} on map`}><span>{index + 1}</span><Icon name="pin" size={18} />Show on map</button>{details(facility)}</section>)}</div>}
      {!facilities.length && <div className="empty-state"><b>No mapped places match</b><p>Try another area or remove a filter. This directory is not complete.</p><button onClick={() => { setMaternity(false); setAlways(false); setSearch(""); setCategory("All"); }}>Clear filters</button></div>}
    </>}
    <p className="care-source-note">OpenStreetMap community data{fetchedAt ? ` · fetched ${new Date(fetchedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}` : ""}. Availability and services are unverified; call ahead. No travel times or ambulance availability are implied. In an emergency, contact emergency services directly.</p>
    <BottomNav active="care" navigate={navigate} onProfile={onProfile} chw={chw} />
  </main>;
}
