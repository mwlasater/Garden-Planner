import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGarden } from "../store";
import { USDA_ZONES, ZONE_BY_ID } from "../data/zones";
import { getZoneForZip } from "../data/zip-zones";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
});

const markerIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickToPlace({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [lat, lon, map]);
  return null;
}

export function LocationPanel() {
  const location = useGarden((s) => s.location);
  const setLocation = useGarden((s) => s.setLocation);
  const [draft, setDraft] = useState(location);
  const [zoneFromZip, setZoneFromZip] = useState(false);

  const center: [number, number] =
    draft.lat != null && draft.lon != null
      ? [draft.lat, draft.lon]
      : [39.8283, -98.5795];

  const onPick = (lat: number, lon: number) => {
    setDraft({ ...draft, lat, lon });
  };

  const applyZone = (zone: string | undefined, fromZip: boolean) => {
    const info = zone ? ZONE_BY_ID.get(zone) : undefined;
    setDraft((prev) => ({
      ...prev,
      usdaZone: zone || undefined,
      lastFrost: info?.lastFrost,
      firstFrost: info?.firstFrost,
    }));
    setZoneFromZip(fromZip);
  };

  const onZoneChange = (zone: string) => applyZone(zone, false);

  const onZipChange = (zip: string) => {
    setDraft((prev) => ({ ...prev, zip }));
    const detected = getZoneForZip(zip);
    if (detected) applyZone(detected, true);
    else setZoneFromZip(false);
  };

  const save = () => setLocation(draft);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">Pick your garden's location</h2>
        <p className="text-sm text-stone-600 mb-3">
          Click anywhere on the map to drop a pin. This is just a visual reference —
          for accurate hardiness data, set your USDA zone below.
        </p>
        <MapContainer center={center} zoom={draft.lat ? 11 : 4} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPick={onPick} />
          {draft.lat != null && draft.lon != null && (
            <>
              <Marker position={[draft.lat, draft.lon]} icon={markerIcon} />
              <RecenterMap lat={draft.lat} lon={draft.lon} />
            </>
          )}
        </MapContainer>
        {draft.lat != null && draft.lon != null && (
          <p className="text-xs text-stone-500 mt-1">
            Pin: {draft.lat.toFixed(4)}, {draft.lon.toFixed(4)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="block font-medium text-stone-700 mb-1">
            Location label
          </span>
          <input
            className="w-full rounded border border-stone-300 px-2 py-1"
            placeholder="e.g. Backyard, Brooklyn, NY"
            value={draft.label ?? ""}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-stone-700 mb-1">ZIP code</span>
          <input
            className="w-full rounded border border-stone-300 px-2 py-1"
            placeholder="12345"
            value={draft.zip ?? ""}
            onChange={(e) => onZipChange(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-stone-700 mb-1">
            USDA hardiness zone
          </span>
          <select
            className="w-full rounded border border-stone-300 px-2 py-1 bg-white"
            value={draft.usdaZone ?? ""}
            onChange={(e) => onZoneChange(e.target.value)}
          >
            <option value="">Select…</option>
            {USDA_ZONES.map((z) => (
              <option key={z.zone} value={z.zone}>
                {z.zone} ({z.minTempF[0]}°F to {z.minTempF[1]}°F)
              </option>
            ))}
          </select>
          {zoneFromZip && draft.usdaZone && (
            <span className="block text-xs text-leaf-700 mt-1">
              Auto-detected from ZIP (approximate — verify with USDA if unsure)
            </span>
          )}
        </label>
        <div className="text-sm">
          <span className="block font-medium text-stone-700 mb-1">Frost dates</span>
          <div className="rounded border border-stone-200 bg-stone-50 px-2 py-1 text-stone-700">
            {draft.lastFrost && draft.firstFrost
              ? `Last: ${draft.lastFrost} · First: ${draft.firstFrost}`
              : "—"}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="rounded bg-leaf-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-leaf-700"
          onClick={save}
        >
          Save location
        </button>
        <a
          className="text-sm text-leaf-700 underline self-center"
          href="https://planthardiness.ars.usda.gov/"
          target="_blank"
          rel="noreferrer"
        >
          Look up your zone (USDA)
        </a>
      </div>
    </div>
  );
}
