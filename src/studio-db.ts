"use client";

import {
  createStarterApps,
  DEFAULT_SETTINGS,
  type AppDataRecord,
  type MiniApp,
  type StudioBackup,
  type StudioSettings,
} from "./studio-core";

const DB_NAME = "zaid-mini-studio";
const DB_VERSION = 1;
const APPS_STORE = "apps";
const DATA_STORE = "app-data";
const META_STORE = "meta";
const FALLBACK_KEY = "zaid-mini-studio-fallback";

type MetaRecord = { key: string; value: unknown };
type FallbackState = {
  apps: MiniApp[];
  appData: AppDataRecord[];
  settings: StudioSettings;
};

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB ist auf diesem Gerät nicht verfügbar."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(APPS_STORE)) {
        const store = database.createObjectStore(APPS_STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
      if (!database.objectStoreNames.contains(DATA_STORE)) {
        database.createObjectStore(DATA_STORE, { keyPath: "appId" });
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Die lokale Datenbank konnte nicht geöffnet werden."));
  });
  return databasePromise;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Lokaler Speicherfehler"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Speichervorgang fehlgeschlagen"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Speichervorgang wurde abgebrochen"));
  });
}

function fallbackState(): FallbackState {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    if (raw) return JSON.parse(raw) as FallbackState;
  } catch {
    // The in-memory default below still keeps the interface usable.
  }
  return { apps: [], appData: [], settings: DEFAULT_SETTINGS };
}

function writeFallback(state: FallbackState): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(state));
  } catch {
    // Storage may be blocked in private browsing. The caller still owns its UI state.
  }
}

async function withFallback<T>(primary: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await primary();
  } catch {
    return fallback();
  }
}

export async function loadApps(): Promise<MiniApp[]> {
  const apps = await withFallback(
    async () => {
      const database = await openDatabase();
      const transaction = database.transaction(APPS_STORE, "readonly");
      return requestResult(transaction.objectStore(APPS_STORE).getAll() as IDBRequest<MiniApp[]>);
    },
    () => fallbackState().apps,
  );

  if (apps.length > 0) return apps.sort((a, b) => b.updatedAt - a.updatedAt);
  const starters = createStarterApps();
  await Promise.all(starters.map((app) => putApp(app)));
  return starters;
}

export async function putApp(app: MiniApp): Promise<void> {
  await withFallback(
    async () => {
      const database = await openDatabase();
      const transaction = database.transaction(APPS_STORE, "readwrite");
      transaction.objectStore(APPS_STORE).put(app);
      await transactionDone(transaction);
    },
    () => {
      const state = fallbackState();
      const index = state.apps.findIndex((item) => item.id === app.id);
      if (index >= 0) state.apps[index] = app;
      else state.apps.push(app);
      writeFallback(state);
    },
  );
}

export async function removeApp(appId: string): Promise<void> {
  await withFallback(
    async () => {
      const database = await openDatabase();
      const transaction = database.transaction([APPS_STORE, DATA_STORE], "readwrite");
      transaction.objectStore(APPS_STORE).delete(appId);
      transaction.objectStore(DATA_STORE).delete(appId);
      await transactionDone(transaction);
    },
    () => {
      const state = fallbackState();
      state.apps = state.apps.filter((item) => item.id !== appId);
      state.appData = state.appData.filter((item) => item.appId !== appId);
      writeFallback(state);
    },
  );
}

export async function loadAppData(appId: string): Promise<Record<string, unknown>> {
  const record = await withFallback(
    async () => {
      const database = await openDatabase();
      const transaction = database.transaction(DATA_STORE, "readonly");
      return requestResult(transaction.objectStore(DATA_STORE).get(appId) as IDBRequest<AppDataRecord | undefined>);
    },
    () => fallbackState().appData.find((item) => item.appId === appId),
  );
  return record?.values ?? {};
}

export async function putAppData(appId: string, values: Record<string, unknown>): Promise<void> {
  const record: AppDataRecord = { appId, values, updatedAt: Date.now() };
  await withFallback(
    async () => {
      const database = await openDatabase();
      const transaction = database.transaction(DATA_STORE, "readwrite");
      transaction.objectStore(DATA_STORE).put(record);
      await transactionDone(transaction);
    },
    () => {
      const state = fallbackState();
      const index = state.appData.findIndex((item) => item.appId === appId);
      if (index >= 0) state.appData[index] = record;
      else state.appData.push(record);
      writeFallback(state);
    },
  );
}

export async function loadSettings(): Promise<StudioSettings> {
  const settings = await withFallback(
    async () => {
      const database = await openDatabase();
      const transaction = database.transaction(META_STORE, "readonly");
      const record = await requestResult(transaction.objectStore(META_STORE).get("settings") as IDBRequest<MetaRecord | undefined>);
      return record?.value as StudioSettings | undefined;
    },
    () => fallbackState().settings,
  );
  return { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
}

export async function putSettings(settings: StudioSettings): Promise<void> {
  await withFallback(
    async () => {
      const database = await openDatabase();
      const transaction = database.transaction(META_STORE, "readwrite");
      transaction.objectStore(META_STORE).put({ key: "settings", value: settings } satisfies MetaRecord);
      await transactionDone(transaction);
    },
    () => {
      const state = fallbackState();
      state.settings = settings;
      writeFallback(state);
    },
  );
}

async function loadAllAppData(): Promise<AppDataRecord[]> {
  return withFallback(
    async () => {
      const database = await openDatabase();
      const transaction = database.transaction(DATA_STORE, "readonly");
      return requestResult(transaction.objectStore(DATA_STORE).getAll() as IDBRequest<AppDataRecord[]>);
    },
    () => fallbackState().appData,
  );
}

export async function createBackup(): Promise<StudioBackup> {
  const [apps, appData, settings] = await Promise.all([loadApps(), loadAllAppData(), loadSettings()]);
  return {
    format: "zaid-mini-studio",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    apps,
    appData,
    settings,
  };
}

export async function importBackup(backup: StudioBackup): Promise<void> {
  await withFallback(
    async () => {
      const database = await openDatabase();
      const transaction = database.transaction([APPS_STORE, DATA_STORE, META_STORE], "readwrite");
      const appsStore = transaction.objectStore(APPS_STORE);
      const dataStore = transaction.objectStore(DATA_STORE);
      appsStore.clear();
      dataStore.clear();
      backup.apps.forEach((app) => appsStore.put(app));
      backup.appData.forEach((record) => dataStore.put(record));
      transaction.objectStore(META_STORE).put({ key: "settings", value: backup.settings } satisfies MetaRecord);
      await transactionDone(transaction);
    },
    () => writeFallback({ apps: backup.apps, appData: backup.appData, settings: backup.settings }),
  );
}

export async function resetStudio(): Promise<void> {
  const starters = createStarterApps();
  await withFallback(
    async () => {
      const database = await openDatabase();
      const transaction = database.transaction([APPS_STORE, DATA_STORE, META_STORE], "readwrite");
      const appsStore = transaction.objectStore(APPS_STORE);
      appsStore.clear();
      transaction.objectStore(DATA_STORE).clear();
      transaction.objectStore(META_STORE).clear();
      starters.forEach((app) => appsStore.put(app));
      await transactionDone(transaction);
    },
    () => writeFallback({ apps: starters, appData: [], settings: DEFAULT_SETTINGS }),
  );
}

export async function estimateStorage(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const estimate = await navigator.storage.estimate();
    return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
  } catch {
    return null;
  }
}
