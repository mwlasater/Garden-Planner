import { useEffect, useRef, useState } from "react";
import { useGarden } from "../store";
import { PLANT_BY_ID } from "../data/plants";
import { isTauri, readPhoto, writePhoto } from "../lib/storage";

const uid = () => Math.random().toString(36).slice(2, 10);

function extOf(filename: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(filename);
  return m ? m[1].toLowerCase() : "jpg";
}

export function PlacementDrawer() {
  const selectedId = useGarden((s) => s.selectedPlacementId);
  const placement = useGarden((s) =>
    s.placements.find((p) => p.id === selectedId),
  );
  const selectPlacement = useGarden((s) => s.selectPlacement);
  const setNotes = useGarden((s) => s.setPlacementNotes);
  const addPhoto = useGarden((s) => s.addPlacementPhoto);
  const removePhoto = useGarden((s) => s.removePlacementPhoto);
  const close = () => selectPlacement(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    setDraftNotes(placement?.notes ?? "");
  }, [placement?.id, placement?.notes]);

  // Escape closes the drawer; matches standard modal/drawer UX.
  useEffect(() => {
    if (!placement) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [placement?.id]);

  useEffect(() => {
    if (!placement?.photos || !isTauri()) {
      setPhotoUrls({});
      return;
    }
    let cancelled = false;
    const created: string[] = [];
    (async () => {
      const next: Record<string, string> = {};
      for (const filename of placement.photos ?? []) {
        const bytes = await readPhoto(filename);
        if (cancelled) break;
        if (bytes) {
          // Copy into a fresh ArrayBuffer so TS doesn't complain about
          // the SharedArrayBuffer-compatible signature plugin-fs returns.
          const copy = new Uint8Array(bytes.byteLength);
          copy.set(bytes);
          const url = URL.createObjectURL(new Blob([copy.buffer]));
          created.push(url);
          next[filename] = url;
        }
      }
      if (!cancelled) setPhotoUrls(next);
    })();
    return () => {
      cancelled = true;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [placement?.id, placement?.photos]);

  if (!placement) return null;

  const plant = PLANT_BY_ID.get(placement.plantId);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    try {
      const filename = `${uid()}.${extOf(file.name)}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      await writePhoto(filename, bytes);
      addPhoto(placement.id, filename);
    } catch (err) {
      // arrayBuffer() / writePhoto can fail on disk full, permission denied,
      // or if the Tauri plugin is unavailable. Surface a brief message in
      // the drawer instead of letting it bubble as an uncaught rejection.
      console.error("[PlacementDrawer.onPickFile]", err);
      setPhotoError("Couldn't save photo. Check disk space and permissions.");
    } finally {
      // Always reset so the same file can be re-picked after a failure.
      e.target.value = "";
    }
  };

  const onSaveNotes = () => {
    setNotes(placement.id, draftNotes.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-stone-900/40"
        onClick={close}
        aria-label="Close drawer"
      />
      <div className="w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-start justify-between p-4 border-b border-stone-200">
          <div>
            <div className="text-lg font-semibold text-stone-800">
              {plant?.name ?? placement.plantId}
            </div>
            {plant?.scientificName && (
              <div className="text-xs text-stone-500 italic">{plant.scientificName}</div>
            )}
            {placement.plantedAt && (
              <div className="text-xs text-stone-500 mt-1">
                Planted {new Date(placement.plantedAt).toLocaleDateString()}
              </div>
            )}
          </div>
          <button
            onClick={close}
            className="text-stone-500 hover:text-stone-800 text-sm"
          >
            close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Notes
            </label>
            <textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              onBlur={onSaveNotes}
              rows={5}
              placeholder="Variety, planting depth, observations..."
              className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-stone-700">
                Photos
              </label>
              {isTauri() ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickFile}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs rounded bg-leaf-600 text-white px-2 py-1 hover:bg-leaf-700"
                  >
                    Add photo
                  </button>
                </>
              ) : (
                <span className="text-xs text-stone-500">desktop app only</span>
              )}
            </div>

            {photoError && (
              <div
                role="alert"
                className="mb-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800"
              >
                {photoError}
              </div>
            )}

            {placement.photos && placement.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {placement.photos.map((filename) => (
                  <div
                    key={filename}
                    className="relative aspect-square rounded overflow-hidden border border-stone-200 bg-stone-100"
                  >
                    {photoUrls[filename] ? (
                      <img
                        src={photoUrls[filename]}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-stone-400">
                        loading…
                      </div>
                    )}
                    <button
                      onClick={() => removePhoto(placement.id, filename)}
                      className="absolute top-1 right-1 rounded-full bg-stone-900/60 text-white w-5 h-5 text-xs leading-none hover:bg-red-600"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-stone-500">No photos yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
