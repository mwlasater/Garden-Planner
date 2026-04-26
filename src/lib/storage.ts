import type { StateStorage } from "zustand/middleware";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

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
