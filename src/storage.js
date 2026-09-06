/* ================================================================
   STORAGE SHIM
   The app was born as a claude.ai artifact and talks to window.storage.
   On the open web that object doesn't exist, so we provide the same
   four calls, backed by localStorage. Keys are stored verbatim
   ("fu8-settings", "fu8-done", …) so a backup file is readable and
   the existing load()/save() helpers need no changes at all.

     get(key)      -> Promise<{ key, value } | null>   (null when missing)
     set(key, val) -> Promise<{ key, value }>
     delete(key)   -> Promise<{ key }>
     list(prefix)  -> Promise<{ keys: string[] }>
   ================================================================ */

/* Private-browsing Safari can throw on write, so every call is guarded
   and falls back to an in-memory map for the life of the tab. */
const mem = new Map();
let backend = null;

function store() {
  if (backend) return backend;
  try {
    const probe = "__fu8_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    backend = window.localStorage;
  } catch (e) {
    backend = {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => { mem.set(k, String(v)); },
      removeItem: (k) => { mem.delete(k); },
      key: (i) => Array.from(mem.keys())[i] ?? null,
      get length() { return mem.size; },
    };
  }
  return backend;
}

export const storage = {
  async get(key) {
    const v = store().getItem(key);
    return v === null || v === undefined ? null : { key, value: v };
  },
  async set(key, value) {
    const v = typeof value === "string" ? value : JSON.stringify(value);
    store().setItem(key, v);
    return { key, value: v };
  },
  async delete(key) {
    store().removeItem(key);
    return { key };
  },
  async list(prefix) {
    const s = store(), keys = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k != null && (!prefix || k.indexOf(prefix) === 0)) keys.push(k);
    }
    return { keys };
  },
};

/* Install before React renders. If a real window.storage is already there
   (i.e. we're running back inside claude.ai) leave it alone. */
export function installStorage() {
  if (typeof window === "undefined") return storage;
  if (!window.storage || typeof window.storage.get !== "function") window.storage = storage;
  return window.storage;
}

export default storage;
