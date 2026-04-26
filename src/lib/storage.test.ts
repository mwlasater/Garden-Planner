import { describe, it, expect, afterEach } from "vitest";
import { isTauri } from "./storage";

describe("isTauri", () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("returns false when window is not defined (Node)", () => {
    expect(isTauri()).toBe(false);
  });

  it("returns false when window exists but has no __TAURI_INTERNALS__", () => {
    (globalThis as { window?: unknown }).window = {};
    expect(isTauri()).toBe(false);
  });

  it("returns true when window.__TAURI_INTERNALS__ is present", () => {
    (globalThis as { window?: unknown }).window = { __TAURI_INTERNALS__: {} };
    expect(isTauri()).toBe(true);
  });
});
