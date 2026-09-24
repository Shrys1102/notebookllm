export const APP_NAME = "Mini NotebookLM";
export const AUTH_STORAGE_KEY = "mini-notebooklm:user";
export const SETTINGS_STORAGE_KEY = "mini-notebooklm:settings";
export const SESSION_STORAGE_KEY = "mini-notebooklm:session-id";
export const CHAT_DRAFT_KEY = "mini-notebooklm:chat-draft";
export const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".docx", ".pptx"];
export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Demo mode: auto-provision a local "demo-user" so the workspace loads
// immediately without a login screen. Enabled automatically during `npm run dev`
// (Vite sets DEV=true) or when VITE_DEMO_MODE=true is set explicitly.
// To require real authentication, build/serve without these flags (production),
// or set VITE_DEMO_MODE=false.
export const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === "true";
export const DEMO_USER = "demo-user";
