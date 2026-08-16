/**
 * IndexedDB cache for kundli records.
 * Falls back to localStorage when IDB is unavailable.
 */

const DB_NAME = "astrokundli";
const DB_VERSION = 1;
const STORE = "kundlis";
const META_STORE = "meta";
const LS_KEY = "saved_kundlis";
const LS_META = "astrokundli_meta";

export interface KundliRecord {
  id: string;
  name: string;
  gender: "Male" | "Female";
  date: string;
  time: string;
  place: string;
  latitude: number;
  longitude: number;
  timezone: number;
  createdAt: string;
  updatedAt?: string;
  data?: unknown;
  dasha?: unknown;
  currentDasha?: unknown;
  kp?: unknown;
  vargas?: unknown;
  /** Cache completeness flags */
  cache?: {
    d1?: boolean;
    dasha?: boolean;
    kp?: boolean;
    vargas?: boolean;
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "id" });
        s.createIndex("name", "name", { unique: false });
        s.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
  });
}

function lsGetAll(): KundliRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function lsSaveAll(list: KundliRecord[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 100)));
}

export async function getAllKundlis(): Promise<KundliRecord[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const rows = (req.result as KundliRecord[]) || [];
        rows.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(rows);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return lsGetAll();
  }
}

export async function getKundli(id: string): Promise<KundliRecord | undefined> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as KundliRecord | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return lsGetAll().find((x) => x.id === id);
  }
}

export async function putKundli(record: KundliRecord): Promise<void> {
  const row = { ...record, updatedAt: new Date().toISOString() };
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    // mirror to LS as backup
    const all = lsGetAll().filter((x) => x.id !== row.id);
    all.unshift(row);
    lsSaveAll(all);
  } catch {
    const all = lsGetAll().filter((x) => x.id !== row.id);
    all.unshift(row);
    lsSaveAll(all);
  }
}

export async function deleteKundli(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
  lsSaveAll(lsGetAll().filter((x) => x.id !== id));
}

export async function getMeta<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE, "readonly");
      const req = tx.objectStore(META_STORE).get(key);
      req.onsuccess = () => {
        const row = req.result as { key: string; value: T } | undefined;
        resolve(row ? row.value : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem(LS_META);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj[key] as T) ?? null;
    } catch {
      return null;
    }
  }
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE, "readwrite");
      tx.objectStore(META_STORE).put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* fallback LS */
  }
  try {
    const raw = localStorage.getItem(LS_META);
    const obj = raw ? JSON.parse(raw) : {};
    obj[key] = value;
    localStorage.setItem(LS_META, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

/** Migrate legacy localStorage kundlis into IndexedDB once */
export async function migrateFromLocalStorage(): Promise<void> {
  const legacy = lsGetAll();
  if (!legacy.length) return;
  try {
    const existing = await getAllKundlis();
    const ids = new Set(existing.map((x) => x.id));
    for (const row of legacy) {
      if (!ids.has(row.id)) await putKundli(row as KundliRecord);
    }
  } catch {
    /* ignore */
  }
}
