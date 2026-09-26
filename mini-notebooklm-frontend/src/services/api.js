import axios from "axios";
import { DEFAULT_API_BASE_URL } from "../utils/constants.js";
import { resolveUsername } from "./localStorage.js";

// Vite statically replaces import.meta.env.VITE_API_BASE_URL at build time.
// In production this is always set (e.g. the Render URL) and must take
// priority over any stale localStorage value left from a prior dev session.
// In development (undefined), localStorage is honoured so the user can
// point at a different backend via Settings.
const ENV_API_URL = import.meta.env.VITE_API_BASE_URL || "";
let apiBaseUrl = ENV_API_URL || localStorage.getItem("mini-notebooklm:api-base-url") || DEFAULT_API_BASE_URL;

export function setApiBaseUrl(url) {
  apiBaseUrl = url || DEFAULT_API_BASE_URL;
  localStorage.setItem("mini-notebooklm:api-base-url", apiBaseUrl);
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

function client(timeout = 150000) {
  const username = resolveUsername();

  return axios.create({
    baseURL: apiBaseUrl,
    timeout,
    headers: {
      "X-User-Profile": username
    }
  });
}

export const api = {
  register: async ({ username, password }) => (await client(10000).post("/register", { username, password })).data,
  login: async ({ username, password }) => (await client(10000).post("/login", { username, password })).data,
  health: async () => (await client().get("/health")).data,
  listFiles: async () => (await client().get("/files")).data,
  uploadFile: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    return (
      await client().post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      })
    ).data;
  },
  deleteFile: async (fileName) => (await client().delete(`/files/${encodeURIComponent(fileName)}`)).data,
  ask: async ({ question, session_id, include_sources = true, file_name = null }) =>
    (await client().post("/ask", { question, session_id, include_sources, file_name })).data,
  summarize: async (file_name = null) => (await client().post("/summarize", { file_name })).data,
  getSession: async (sessionId) => (await client().get(`/session/${encodeURIComponent(sessionId)}`)).data,
  clearSession: async (sessionId) => (await client().delete(`/session/${encodeURIComponent(sessionId)}`)).data,
  voiceOverview: async ({ file_name = null, language = "en" }) =>
    (await client().post("/voice-overview", { file_name, language })).data,
  conceptMap: async ({ file_name = null, output_format = "mermaid" }) =>
    (await client().post("/concept-map", { file_name, output_format })).data,
  youtubeVideos: async ({
    topic = null,
    file_name = null,
    language_code = null,
    max_duration_minutes = null,
    sort_by = "views",
    max_results = 5,
  }) =>
    (
      await client().post("/youtube-videos", {
        topic,
        file_name,
        language_code,
        max_duration_minutes,
        sort_by,
        max_results,
      })
    ).data,
  voiceUrl: (downloadUrlOrFile) => {
    if (!downloadUrlOrFile) return "";
    const path = downloadUrlOrFile.startsWith("/") ? downloadUrlOrFile : `/voice-overview/${downloadUrlOrFile}`;
    return `${apiBaseUrl}${path}`;
  },
};
