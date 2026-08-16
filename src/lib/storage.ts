/**
 * Storage facade — IndexedDB primary, localStorage fallback.
 * Keeps the same sync-ish API surface used by pages via async helpers.
 */
import {
  getAllKundlis,
  getKundli,
  putKundli,
  deleteKundli as dbDelete,
  migrateFromLocalStorage,
  KundliRecord,
} from "./db";
import { SavedKundli } from "./types";

export type { KundliRecord };

export async function initStorage(): Promise<void> {
  await migrateFromLocalStorage();
}

export async function getSavedKundlisAsync(): Promise<SavedKundli[]> {
  await migrateFromLocalStorage();
  return (await getAllKundlis()) as SavedKundli[];
}

export async function getKundliByIdAsync(
  id: string
): Promise<SavedKundli | undefined> {
  return (await getKundli(id)) as SavedKundli | undefined;
}

export async function saveKundliAsync(k: SavedKundli): Promise<void> {
  await putKundli(k as KundliRecord);
}

export async function deleteKundliAsync(id: string): Promise<void> {
  await dbDelete(id);
}

/** @deprecated sync helpers for gradual migration — prefer async */
export function getSavedKundlis(): SavedKundli[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("saved_kundlis");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveKundli(k: SavedKundli): void {
  void saveKundliAsync(k);
  // also keep LS mirror immediately
  try {
    const list = getSavedKundlis().filter((x) => x.id !== k.id);
    list.unshift(k);
    localStorage.setItem("saved_kundlis", JSON.stringify(list.slice(0, 100)));
  } catch {
    /* ignore */
  }
}

export function deleteKundli(id: string): void {
  void deleteKundliAsync(id);
  try {
    const list = getSavedKundlis().filter((x) => x.id !== id);
    localStorage.setItem("saved_kundlis", JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getKundliById(id: string): SavedKundli | undefined {
  return getSavedKundlis().find((x) => x.id === id);
}
