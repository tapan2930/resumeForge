/**
 * Resume versions in IndexedDB.
 * Future: replace with Supabase/PostgreSQL — isolate calls here.
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ResumeVersion } from "@/lib/types";

const DB_NAME = "resumeforge";
const DB_VERSION = 1;
const STORE = "versions";

interface RFSchema extends DBSchema {
  versions: {
    key: string;
    value: ResumeVersion;
    indexes: { "by-folder": string };
  };
}

let dbPromise: Promise<IDBPDatabase<RFSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<RFSchema>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = openDB<RFSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("by-folder", "folderId");
        }
      },
    });
  }
  return dbPromise;
}

export async function putVersion(version: ResumeVersion): Promise<void> {
  const db = await getDB();
  await db.put(STORE, version);
}

export async function getVersion(id: string): Promise<ResumeVersion | undefined> {
  const db = await getDB();
  return db.get(STORE, id);
}

export async function deleteVersion(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function listVersionsByFolder(
  folderId: string
): Promise<ResumeVersion[]> {
  const db = await getDB();
  const idx = db.transaction(STORE).store.index("by-folder");
  return idx.getAll(folderId);
}

/** All versions (for dashboard recent list). */
export async function listAllVersions(): Promise<ResumeVersion[]> {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function importVersions(
  versions: ResumeVersion[],
  merge = true
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE, "readwrite");
  if (!merge) {
    await tx.store.clear();
  }
  for (const v of versions) {
    await tx.store.put(v);
  }
  await tx.done;
}
