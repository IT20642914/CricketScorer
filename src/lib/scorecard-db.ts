/**
 * IndexedDB persistence for current match on score page.
 * Saves after each update so scoring feels instant and data is stored locally.
 * Sync to MongoDB happens in parallel; this is for smooth UX and backup.
 */

const DB_NAME = "cricket-scorecard";
const STORE = "matches";
const KEY_PREFIX = "match:";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB only in browser"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
  });
}

export function saveMatchToLocal(matchId: string, match: object): void {
  if (typeof window === "undefined") return;
  openDB()
    .then((db) => {
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        store.put({ id: KEY_PREFIX + matchId, match, updatedAt: Date.now() });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      });
    })
    .catch(() => {});
}

export function getMatchFromLocal(matchId: string): Promise<object | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  return openDB()
    .then((db) => {
      return new Promise<object | null>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const req = store.get(KEY_PREFIX + matchId);
        req.onsuccess = () => {
          db.close();
          const row = req.result;
          resolve(row?.match ?? null);
        };
        req.onerror = () => reject(req.error);
      });
    })
    .catch(() => null);
}

/** Remove match from IndexedDB after match has ended and been saved (keeps cache clean). */
export function removeMatchFromLocal(matchId: string): void {
  if (typeof window === "undefined") return;
  openDB()
    .then((db) => {
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        store.delete(KEY_PREFIX + matchId);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      });
    })
    .catch(() => {});
}
