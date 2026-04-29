import type { StateStorage } from "zustand/middleware";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// Decoupled from STORAGE_KEY on purpose — the persisted file name should
// stay stable across Zustand key changes (e.g. namespace reorgs) so users
// don't lose data on upgrade.
const FILE = "garden.json";

// Lazy import so the @tauri-apps/plugin-fs module is never resolved in
// browser-only builds (and never accidentally executed in unit tests).
async function tauriFs() {
  const fs = await import("@tauri-apps/plugin-fs");
  return { fs, opts: { baseDir: fs.BaseDirectory.AppData } };
}

export const tauriFileStorage: StateStorage = {
  async getItem(key) {
    try {
      const { fs, opts } = await tauriFs();
      if (await fs.exists(FILE, opts)) {
        return await fs.readTextFile(FILE, opts);
      }
      // First run on desktop: file doesn't exist yet. If the user has prior
      // localStorage data from a browser/dev session, fall back to that —
      // the next setItem will write it to the file as the new source of truth.
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(key);
      }
      return null;
    } catch (err) {
      console.error("[tauriFileStorage.getItem]", err);
      return null;
    }
  },
  async setItem(_key, value) {
    try {
      const { fs, opts } = await tauriFs();
      await fs.writeTextFile(FILE, value, opts);
    } catch (err) {
      console.error("[tauriFileStorage.setItem]", err);
    }
  },
  // The Zustand `key` argument is intentionally ignored here (and in
  // getItem/setItem above) — this adapter is hardcoded to the single
  // FILE path; the key only matters for the localStorage fallback.
  async removeItem() {
    try {
      const { fs, opts } = await tauriFs();
      if (await fs.exists(FILE, opts)) {
        await fs.remove(FILE, opts);
      }
    } catch (err) {
      console.error("[tauriFileStorage.removeItem]", err);
    }
  },
};

const PHOTOS_DIR = "photos";

// Cache the directory check so subsequent writePhoto calls within a single
// session skip the exists+mkdir IPC round-trip.
let photosDirReady: Promise<void> | null = null;

async function ensurePhotosDir(): Promise<void> {
  if (!photosDirReady) {
    photosDirReady = (async () => {
      const { fs, opts } = await tauriFs();
      if (!(await fs.exists(PHOTOS_DIR, opts))) {
        await fs.mkdir(PHOTOS_DIR, { ...opts, recursive: true });
      }
    })().catch((err) => {
      // Reset on failure so the next call retries instead of returning the
      // rejected promise indefinitely.
      photosDirReady = null;
      throw err;
    });
  }
  return photosDirReady;
}

export async function writePhoto(
  filename: string,
  bytes: Uint8Array,
): Promise<void> {
  await ensurePhotosDir();
  const { fs, opts } = await tauriFs();
  await fs.writeFile(`${PHOTOS_DIR}/${filename}`, bytes, opts);
}

export async function readPhoto(filename: string): Promise<Uint8Array | null> {
  try {
    const { fs, opts } = await tauriFs();
    const path = `${PHOTOS_DIR}/${filename}`;
    if (!(await fs.exists(path, opts))) return null;
    return await fs.readFile(path, opts);
  } catch (err) {
    console.error("[readPhoto]", err);
    return null;
  }
}

export async function deletePhoto(filename: string): Promise<void> {
  try {
    const { fs, opts } = await tauriFs();
    const path = `${PHOTOS_DIR}/${filename}`;
    if (await fs.exists(path, opts)) {
      await fs.remove(path, opts);
    }
  } catch (err) {
    console.error("[deletePhoto]", err);
  }
}
