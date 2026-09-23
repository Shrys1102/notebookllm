/**
 * Safe localStorage helpers.
 *
 * localStorage can throw (quota, private mode, disabled storage).
 * Every read/write is wrapped so research features degrade gracefully
 * instead of crashing the workspace.
 */

const storage = typeof window !== "undefined" ? window.localStorage : null;

export function storageGet(key, fallback = null) {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function storageRemove(key) {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Build a per-user namespaced key. Returns null when the user is unknown,
 * in which case callers should fall back to unpersisted in-memory state.
 */
export function userStorageKey(key, username) {
  if (!username) return null;
  return `mini-notebooklm:${username}:${key}`;
}

export function userStorageGet(key, username, fallback = null) {
  const fullKey = userStorageKey(key, username);
  if (!fullKey) return fallback;
  return storageGet(fullKey, fallback);
}

export function userStorageSet(key, username, value) {
  const fullKey = userStorageKey(key, username);
  if (!fullKey) return false;
  return storageSet(fullKey, value);
}