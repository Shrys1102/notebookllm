import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { api } from "../services/api.js";
import { CHAT_DRAFT_KEY, SESSION_STORAGE_KEY } from "../utils/constants.js";
import { makeSessionId, normalizeError } from "../utils/formatters.js";

// Message status model: "completed" today. Future streaming phases map onto
// thinking → retrieving → reading sources → generating → completed | error
// without redesigning the chat surface.
function makeMessage(role, content, extra = {}) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    sources: [],
    status: "completed",
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

function toUiMessages(messages = []) {
  return messages.map((message) =>
    makeMessage(message.role, message.content, {
      sources: message.sources || [],
    })
  );
}

export function useChat() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_STORAGE_KEY) || makeSessionId(user?.username));
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState(() => localStorage.getItem(CHAT_DRAFT_KEY) || "");
  const [asking, setAsking] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem(CHAT_DRAFT_KEY, draft);
  }, [draft]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getSession(sessionId);
      setMessages(toUiMessages(data.messages || []));
    } catch (error) {
      pushToast({ variant: "error", title: "Session history unavailable", message: normalizeError(error) });
    } finally {
      setHistoryLoading(false);
    }
  }, [pushToast, sessionId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const askQuestion = useCallback(
    async (question, fileName = null) => {
      const cleanQuestion = question.trim();
      if (!cleanQuestion) return;

      const userMessage = makeMessage("user", cleanQuestion);

      setMessages((current) => [...current, userMessage]);
      setDraft("");
      setAsking(true);

      try {
        const data = await api.ask({
          question: cleanQuestion,
          session_id: sessionId,
          include_sources: true,
          file_name: fileName,
        });
        setMessages((current) => [
          ...current,
          makeMessage("assistant", data.answer, { sources: data.sources || [] }),
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          makeMessage("assistant", normalizeError(error), { isError: true }),
        ]);
      } finally {
        setAsking(false);
      }
    },
    [sessionId]
  );

  const regenerateResponse = useCallback(
    async (assistantMessageId, fileName = null) => {
      if (asking) return;

      const targetIdx = messages.findIndex((m) => m.id === assistantMessageId);
      if (targetIdx === -1) return;

      // Find the user message preceding this assistant response
      let userMsg = null;
      for (let i = targetIdx - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          userMsg = messages[i];
          break;
        }
      }

      if (!userMsg) return;

      // Remove the old assistant message
      setMessages((current) => current.filter((m) => m.id !== assistantMessageId));
      setAsking(true);

      try {
        const data = await api.ask({
          question: userMsg.content,
          session_id: sessionId,
          include_sources: true,
          file_name: fileName,
        });
        setMessages((current) => [
          ...current,
          makeMessage("assistant", data.answer, { sources: data.sources || [] }),
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          makeMessage("assistant", normalizeError(error), { isError: true }),
        ]);
      } finally {
        setAsking(false);
      }
    },
    [asking, messages, sessionId]
  );

  const clearSession = useCallback(async () => {
    try {
      await api.clearSession(sessionId);
      setMessages([]);
      pushToast({ variant: "success", title: "Session cleared", message: "Conversation memory is empty." });
    } catch (error) {
      pushToast({ variant: "error", title: "Clear failed", message: normalizeError(error) });
    }
  }, [pushToast, sessionId]);

  const startNewSession = useCallback(() => {
    const nextId = makeSessionId(user?.username);
    setSessionId(nextId);
    setMessages([]);
    setDraft("");
  }, [user?.username]);

  return useMemo(
    () => ({
      sessionId,
      messages,
      draft,
      asking,
      historyLoading,
      setDraft,
      askQuestion,
      regenerateResponse,
      clearSession,
      startNewSession,
      loadHistory,
    }),
    [sessionId, messages, draft, asking, historyLoading, askQuestion, regenerateResponse, clearSession, startNewSession, loadHistory]
  );
}
