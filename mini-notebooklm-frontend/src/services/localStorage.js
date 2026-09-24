/**
 * Safe localStorage helpers.
 *
 * localStorage can throw (quota, private mode, disabled storage).
 * Every read/write is wrapped so research features degrade gracefully
 * instead of crashing the workspace.
 */

import { AUTH_STORAGE_KEY, DEMO_MODE, DEMO_USER } from "../utils/constants.js";

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

// ─────────────────────────────────────────────────────────────────────
// Auth session helpers (shared between AuthContext and the API client so
// the demo user is consistently sent as the X-User-Profile header).
// ─────────────────────────────────────────────────────────────────────

// Active tab session — managed by AuthProvider (writes here on login/demo).
export function getSessionUser() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function setSessionUser(user) {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (user) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

// Persisted store — survives browser/tab restarts (used for the demo user).
export function getPersistedUser() {
  return storageGet(AUTH_STORAGE_KEY);
}

export function setPersistedUser(user) {
  if (user) {
    storageSet(AUTH_STORAGE_KEY, user);
  } else {
    storageRemove(AUTH_STORAGE_KEY);
  }
}

// The local demo identity. No password, no credential, clearly non-production.
export function getDemoUser() {
  return { username: DEMO_USER, isDemo: true };
}

/**
 * Resolve the username that travels as the X-User-Profile header on every
 * API request.
 *   1. Active tab session (AuthProvider-managed, incl. demo session).
 *   2. In demo mode, fall back to the stable demo user.
 *   3. Otherwise "anonymous".
 */
export function resolveUsername() {
  const sessionUser = getSessionUser();
  if (sessionUser?.username) return sessionUser.username;
  if (DEMO_MODE) return DEMO_USER;
  return "anonymous";
}
