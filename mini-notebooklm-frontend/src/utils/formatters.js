import { DEFAULT_API_BASE_URL } from "./constants.js";

export function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getFileExtension(fileName = "") {
  const match = fileName.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : "";
}

/**
 * Classify an axios error into a structured object so the UI can display
 * accurate, actionable messages instead of a generic "Cannot reach the backend".
 *
 * Error categories:
 *  - "connection":  Backend cannot be reached (network-level failure).
 *  - "api":         Backend responded with a 4xx/5xx status code.
 *  - "llm":         Backend reached but LLM provider rejected the request
 *                   (typically an API-key or quota problem).
 *  - "retrieval":   ChromaDB / embedding / vector-store failure.
 *  - "unknown":     Everything else.
 */
export function classifyError(error) {
  if (!error) return { category: "unknown", message: "Something went wrong." };

  // Network-level failure: server unreachable, CORS blocked, DNS, etc.
  if (error.code === "ECONNABORTED") {
    return { category: "connection", message: "The request timed out. The backend may still be working." };
  }
  if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
    return {
      category: "connection",
       message: `Backend unavailable (${DEFAULT_API_BASE_URL}). Please check your connection and try again later.`,
    };
  }

  // The backend responded with a non-2xx status.
  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  const detailStr = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((i) => i.msg).join(", ") : null;

  if (status === 401 || status === 403) {
    return { category: "auth", message: "Authentication failed. Please sign in again." };
  }
  if (status === 404) {
    return { category: "api", message: "The requested resource was not found." };
  }
  if (status === 422) {
    return { category: "api", message: detailStr || "The request was invalid." };
  }

  // 503 from the backend — explicit LLM configuration problem.
  if (status === 503) {
    const msg = detailStr || "LLM service is not configured or the API key is invalid.";
    return { category: "llm", message: msg };
  }

  // 502 — upstream LLM provider error.
  if (status === 502) {
    const msg = detailStr || "LLM provider returned an error.";
    if (msg.includes("API key not valid") || msg.toLowerCase().includes("api key")) {
      return { category: "llm", message: "LLM service is not configured. Set a valid GEMINI_API_KEY or OPENAI_API_KEY in .env." };
    }
    return { category: "llm", message: msg };
  }

  // 500 — generic server error, inspect detail for retrieval vs LLM issues.
  if (status === 500) {
    if (detailStr) {
      const lower = detailStr.toLowerCase();
      if (lower.includes("embed") || lower.includes("chroma") || lower.includes("retrieval") || lower.includes("vector")) {
        return { category: "retrieval", message: "Unable to retrieve relevant sources from the vector index." };
      }
      if (lower.includes("api key") || lower.includes("gemini") || lower.includes("openai") || lower.includes("llm")) {
        return {
          category: "llm",
          message: "LLM service is not configured or the API key is invalid. Set GEMINI_API_KEY in .env.",
        };
      }
      return { category: "api", message: detailStr };
    }
    return { category: "api", message: "Backend returned an internal error (500)." };
  }

  // Fallback: use detail or raw message.
  if (detailStr) return { category: "api", message: detailStr };
  return { category: "unknown", message: error.message || "Something went wrong." };
}

export function normalizeError(error) {
  return classifyError(error).message;
}

export function makeSessionId(username = "guest") {
  const safeUser = username.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${safeUser || "guest"}-${crypto.randomUUID()}`;
}

export function isMermaid(value = "") {
  return /^\s*(mindmap|graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|timeline)/i.test(value);
}
