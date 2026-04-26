import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Bed, GardenState, Location, Placement } from "./types";
import { PLANT_BY_ID } from "./data/plants";
import { plantsPerSquareFoot } from "./lib/spacing";
import { isTauri, tauriFileStorage, deletePhoto } from "./lib/storage";

export const STORAGE_KEY = "garden-planner-state-v1";

type Actions = {
  setGardenName: (name: string) => void;
  setLocation: (location: Location) => void;
  addBed: (bed: Omit<Bed, "id">) => string;
  updateBed: (id: string, patch: Partial<Bed>) => void;
  removeBed: (id: string) => void;
  placePlant: (bedId: string, plantId: string, row: number, col: number) => void;
  movePlacement: (placementId: string, bedId: string, row: number, col: number) => void;
  removePlacement: (placementId: string) => void;
  setPlacementNotes: (placementId: string, notes: string) => void;
  addPlacementPhoto: (placementId: string, filename: string) => void;
  removePlacementPhoto: (placementId: string, filename: string) => void;
  selectPlacement: (placementId: string | null) => void;
  resetGarden: () => void;
};

type Transient = {
  selectedPlacementId: string | null;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const initial: GardenState = {
  gardenName: "My Garden",
  location: {},
  beds: [],
  placements: [],
};

export const useGarden = create<GardenState & Actions & Transient>()(
  persist(
    (set) => ({
      ...initial,
      selectedPlacementId: null,
      setGardenName: (name) => set({ gardenName: name }),
      setLocation: (location) => set({ location }),
      addBed: (bed) => {
        const id = uid();
        set((s) => ({ beds: [...s.beds, { ...bed, id }] }));
        return id;
      },
      updateBed: (id, patch) =>
        set((s) => ({
          beds: s.beds.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      removeBed: (id) =>
        set((s) => ({
          beds: s.beds.filter((b) => b.id !== id),
          placements: s.placements.filter((p) => p.bedId !== id),
        })),
      placePlant: (bedId, plantId, row, col) =>
        set((s) => {
          const plant = PLANT_BY_ID.get(plantId);
          if (!plant) return s;
          const occupants = s.placements.filter(
            (p) => p.bedId === bedId && p.row === row && p.col === col,
          );
          // Cell already holds a different species — reject.
          if (occupants.length > 0 && occupants[0].plantId !== plantId) return s;
          // Cell at capacity for this plant's spacing — reject.
          if (occupants.length >= plantsPerSquareFoot(plant.spacingInches)) return s;
          const placement: Placement = {
            id: uid(),
            bedId,
            plantId,
            row,
            col,
            plantedAt: new Date().toISOString(),
          };
          return { placements: [...s.placements, placement] };
        }),
      movePlacement: (placementId, bedId, row, col) =>
        set((s) => {
          const moving = s.placements.find((p) => p.id === placementId);
          if (!moving) return s;
          const plant = PLANT_BY_ID.get(moving.plantId);
          if (!plant) return s;
          const occupants = s.placements.filter(
            (p) =>
              p.id !== placementId &&
              p.bedId === bedId &&
              p.row === row &&
              p.col === col,
          );
          // Different species in target cell — reject.
          if (occupants.length > 0 && occupants[0].plantId !== moving.plantId) return s;
          // Target cell at capacity — reject.
          if (occupants.length >= plantsPerSquareFoot(plant.spacingInches)) return s;
          return {
            placements: s.placements.map((p) =>
              p.id === placementId ? { ...p, bedId, row, col } : p,
            ),
          };
        }),
      removePlacement: (placementId) =>
        set((s) => {
          const removing = s.placements.find((p) => p.id === placementId);
          if (removing?.photos && isTauri()) {
            // Fire-and-forget photo cleanup; failures are logged inside
            // deletePhoto and shouldn't block state mutation.
            for (const filename of removing.photos) deletePhoto(filename);
          }
          return {
            placements: s.placements.filter((p) => p.id !== placementId),
            selectedPlacementId:
              s.selectedPlacementId === placementId ? null : s.selectedPlacementId,
          };
        }),
      setPlacementNotes: (placementId, notes) =>
        set((s) => ({
          placements: s.placements.map((p) =>
            p.id === placementId
              ? { ...p, notes: notes.length > 0 ? notes : undefined }
              : p,
          ),
        })),
      addPlacementPhoto: (placementId, filename) =>
        set((s) => ({
          placements: s.placements.map((p) =>
            p.id === placementId
              ? { ...p, photos: [...(p.photos ?? []), filename] }
              : p,
          ),
        })),
      removePlacementPhoto: (placementId, filename) =>
        set((s) => ({
          placements: s.placements.map((p) => {
            if (p.id !== placementId) return p;
            const filtered = (p.photos ?? []).filter((f) => f !== filename);
            return { ...p, photos: filtered.length > 0 ? filtered : undefined };
          }),
        })),
      selectPlacement: (placementId) => set({ selectedPlacementId: placementId }),
      resetGarden: () => set({ ...initial, selectedPlacementId: null }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      // In Tauri (desktop) we persist to a JSON file in the OS app-data dir
      // so user data survives a webview cache clear and is portable to
      // backup tools. In a plain browser we keep the localStorage default.
      storage: createJSONStorage(() =>
        isTauri() ? tauriFileStorage : localStorage,
      ),
      // Strip transient UI state (selection) from what gets persisted.
      partialize: (s) => ({
        gardenName: s.gardenName,
        location: s.location,
        beds: s.beds,
        placements: s.placements,
      }),
      migrate: (persisted, version) => {
        // v0 → v1: no schema changes; pass through unchanged.
        // Future migrations should set new required fields explicitly
        // rather than relying on the GardenState cast.
        if (version === 0) return persisted as GardenState;
        return persisted as GardenState;
      },
    },
  ),
);
