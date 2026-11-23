import { BaseDirectory, exists, mkdir, readDir, readFile, readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs';
import { open, save } from '@tauri-apps/plugin-dialog';
import { CareerSave, SaveSlotMeta } from '../types';
import { migrateCareerSave } from '../engine/saveMigration';

const SAVES_DIR = 'saves';
const FALLBACK_STORAGE_KEY = 'basket_manager_italia_saves_v1';
const IDB_NAME = 'basket_manager_italia_db';
const IDB_STORE = 'saves';
const IDB_VERSION = 1;

function hasIndexedDB(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openSavesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'slotId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open error'));
  });
}

async function idbGetAllSaves(): Promise<CareerSave[]> {
  const db = await openSavesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      db.close();
      resolve((req.result as CareerSave[]) ?? []);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function idbGetSave(slotId: string): Promise<CareerSave | null> {
  const db = await openSavesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(slotId);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as CareerSave | undefined) ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function idbPutSave(saveData: CareerSave): Promise<void> {
  const db = await openSavesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.put(saveData);
    req.onsuccess = () => {
      db.close();
      resolve();
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function idbDeleteSave(slotId: string): Promise<void> {
  const db = await openSavesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.delete(slotId);
    req.onsuccess = () => {
      db.close();
      resolve();
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

function readLegacyLocalStorageMap(): Record<string, CareerSave> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CareerSave>;
  } catch {
    return {};
  }
}

function writeLegacyLocalStorageMap(map: Record<string, CareerSave>): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function parseAndMigrateCareerSave(raw: unknown): CareerSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const candidate = raw as Partial<CareerSave>;
  if (!Array.isArray(candidate.teams) || candidate.teams.length === 0) return null;
  return migrateCareerSave(candidate as CareerSave);
}

function toMeta(saveData: CareerSave): SaveSlotMeta {
  const teams = saveData.teams ?? [];
  const userTeam = teams.find((t) => t.id === saveData.userTeamId);
  return {
    slotId: saveData.slotId || 'slot_migrated',
    slotName: saveData.slotName || 'Carriera',
    savedAt: saveData.savedAt || new Date().toISOString(),
    managerName: saveData.managerName || 'Coach',
    teamName: userTeam?.name ?? saveData.userTeamId ?? 'Club',
    seasonYear: saveData.seasonYear ?? 2026,
    currentRound: saveData.currentRound ?? 1,
    phase: saveData.phase ?? 'regular',
  };
}

async function ensureSavesDir(): Promise<void> {
  const dirExists = await exists(SAVES_DIR, { baseDir: BaseDirectory.AppLocalData });
  if (!dirExists) {
    await mkdir(SAVES_DIR, { baseDir: BaseDirectory.AppLocalData, recursive: true });
  }
}

export async function listSaveSlots(): Promise<SaveSlotMeta[]> {
  if (!isTauriRuntime()) {
    const byId = new Map<string, CareerSave>();
    const legacy = readLegacyLocalStorageMap();
    for (const saveData of Object.values(legacy)) {
      const migrated = parseAndMigrateCareerSave(saveData);
      if (migrated) byId.set(migrated.slotId, migrated);
    }

    if (hasIndexedDB()) {
      try {
        const idbSaves = await idbGetAllSaves();
        for (const saveData of idbSaves) {
          const migrated = parseAndMigrateCareerSave(saveData);
          if (migrated) byId.set(migrated.slotId, migrated);
        }
      } catch {
        // Fallback ai salvataggi legacy già caricati
      }
    }

    return Array.from(byId.values())
      .map(toMeta)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }

  await ensureSavesDir();
  const entries = await readDir(SAVES_DIR, { baseDir: BaseDirectory.AppLocalData });
  const metas: SaveSlotMeta[] = [];

  for (const entry of entries) {
    if (entry.isFile && entry.name.endsWith('.json')) {
      try {
        const content = await readTextFile(`${SAVES_DIR}/${entry.name}`, {
          baseDir: BaseDirectory.AppLocalData,
        });
        const migrated = parseAndMigrateCareerSave(JSON.parse(content));
        if (migrated) metas.push(toMeta(migrated));
      } catch {
        // Ignora file corrotti
      }
    }
  }

  return metas.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function saveCareerToSlot(career: CareerSave): Promise<void> {
  const payload: CareerSave = migrateCareerSave({
    ...career,
    savedAt: new Date().toISOString(),
  });

  if (!isTauriRuntime()) {
    if (hasIndexedDB()) {
      try {
        await idbPutSave(payload);
        // Rimuove eventuale copia legacy in localStorage per liberare quota
        const legacy = readLegacyLocalStorageMap();
        if (legacy[payload.slotId]) {
          delete legacy[payload.slotId];
          if (Object.keys(legacy).length === 0 && typeof localStorage !== 'undefined') {
            localStorage.removeItem(FALLBACK_STORAGE_KEY);
          } else {
            writeLegacyLocalStorageMap(legacy);
          }
        }
        return;
      } catch {
        // Fallback su localStorage se IndexedDB non è scrivibile
      }
    }

    const map = readLegacyLocalStorageMap();
    map[payload.slotId] = payload;
    writeLegacyLocalStorageMap(map);
    return;
  }

  await ensureSavesDir();
  const fileName = `${SAVES_DIR}/${payload.slotId}.json`;
  await writeTextFile(fileName, JSON.stringify(payload, null, 2), {
    baseDir: BaseDirectory.AppLocalData,
  });
}

export async function loadCareerFromSlot(slotId: string): Promise<CareerSave | null> {
  if (!isTauriRuntime()) {
    if (hasIndexedDB()) {
      try {
        const fromIdb = await idbGetSave(slotId);
        if (fromIdb) return parseAndMigrateCareerSave(fromIdb);
      } catch {
        // Fallback su localStorage
      }
    }
    const map = readLegacyLocalStorageMap();
    return parseAndMigrateCareerSave(map[slotId] ?? null);
  }

  const fileName = `${SAVES_DIR}/${slotId}.json`;
  const fileExists = await exists(fileName, { baseDir: BaseDirectory.AppLocalData });
  if (!fileExists) return null;

  const content = await readTextFile(fileName, { baseDir: BaseDirectory.AppLocalData });
  return parseAndMigrateCareerSave(JSON.parse(content));
}

export async function deleteSaveSlot(slotId: string): Promise<void> {
  if (!isTauriRuntime()) {
    if (hasIndexedDB()) {
      try {
        await idbDeleteSave(slotId);
      } catch {
        // Ignora eventuali errori IndexedDB in cancellazione
      }
    }
    const map = readLegacyLocalStorageMap();
    if (map[slotId]) {
      delete map[slotId];
      if (Object.keys(map).length === 0 && typeof localStorage !== 'undefined') {
        localStorage.removeItem(FALLBACK_STORAGE_KEY);
      } else {
        writeLegacyLocalStorageMap(map);
      }
    }
    return;
  }

  const fileName = `${SAVES_DIR}/${slotId}.json`;
  const fileExists = await exists(fileName, { baseDir: BaseDirectory.AppLocalData });
  if (fileExists) {
    await remove(fileName, { baseDir: BaseDirectory.AppLocalData });
  }
}

export async function exportCareerToFileDialog(career: CareerSave): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  const migrated = migrateCareerSave(career);
  const targetPath = await save({
    defaultPath: `${migrated.slotName.replace(/\s+/g, '_')}.json`,
    filters: [{ name: 'Salvataggio Basket Manager', extensions: ['json'] }],
  });
  if (!targetPath) return false;
  await writeTextFile(targetPath, JSON.stringify(migrated, null, 2));
  return true;
}

export async function importCareerFromFileDialog(): Promise<CareerSave | null> {
  if (!isTauriRuntime()) return null;
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Salvataggio Basket Manager', extensions: ['json'] }],
  });
  if (!selected || Array.isArray(selected)) return null;
  const content = await readTextFile(selected);
  return parseAndMigrateCareerSave(JSON.parse(content));
}

export async function pickManagerPhotoDialog(): Promise<string | null> {
  if (!isTauriRuntime()) return null;
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Immagini', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
  });
  if (!selected || Array.isArray(selected)) return null;
  const bytes = await readFile(selected);
  const ext = selected.split('.').pop()?.toLowerCase() ?? 'png';
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}
