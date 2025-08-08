import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
}

type StorageAdapter = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

const hasChromeStorage =
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as unknown as { chrome?: unknown }).chrome !== 'undefined' &&
  typeof (globalThis as unknown as { chrome?: { storage?: { local?: unknown } } }).chrome?.storage?.local !==
    'undefined';

const chromeStorageAdapter: StorageAdapter = {
  async getItem(key: string) {
    return new Promise<string | null>((resolve) => {
      (globalThis as unknown as { chrome: { storage: { local: { get: Function } } } }).chrome.storage.local.get(
        [key],
        (result: Record<string, string | undefined>) => {
        resolve(result?.[key] ?? null);
        },
      );
    });
  },
  async setItem(key: string, value: string) {
    return new Promise<void>((resolve) => {
      (globalThis as unknown as { chrome: { storage: { local: { set: Function } } } }).chrome.storage.local.set(
        { [key]: value },
        () => resolve(),
      );
    });
  },
  async removeItem(key: string) {
    return new Promise<void>((resolve) => {
      (globalThis as unknown as { chrome: { storage: { local: { remove: Function } } } }).chrome.storage.local.remove(
        [key],
        () => resolve(),
      );
    });
  },
};

const localStorageAdapter: StorageAdapter = {
  getItem(key: string) {
    try {
      return globalThis?.localStorage?.getItem?.(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      globalThis?.localStorage?.setItem?.(key, value);
    } catch {
    }
  },
  removeItem(key: string) {
    try {
      globalThis?.localStorage?.removeItem?.(key);
    } catch {
    }
  },
};

const selectedStorage: StorageAdapter = hasChromeStorage
  ? chromeStorageAdapter
  : localStorageAdapter;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: selectedStorage,
  },
});

