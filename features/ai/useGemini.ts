"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  getResolvedGeminiModel,
  setGeminiApiKey as persistKey,
  setGeminiModelId,
} from "@/lib/storage";
import { generateText } from "@/features/ai/gemini";
import { GEMINI_PING_USER, DEFAULT_GEMINI_MODEL } from "@/lib/prompts";

export function useGemini() {
  const [hasKey, setHasKey] = useState(false);
  const [modelId, setModelIdState] = useState(DEFAULT_GEMINI_MODEL);

  const syncModelFromStorage = useCallback(() => {
    setModelIdState(getResolvedGeminiModel());
  }, []);

  useEffect(() => {
    setHasKey(!!getGeminiApiKey());
    syncModelFromStorage();
  }, [syncModelFromStorage]);

  const refresh = useCallback(() => {
    setHasKey(!!getGeminiApiKey());
    syncModelFromStorage();
  }, [syncModelFromStorage]);

  const saveKey = useCallback((key: string) => {
    persistKey(key.trim());
    setHasKey(true);
  }, []);

  const removeKey = useCallback(() => {
    clearGeminiApiKey();
    setHasKey(false);
  }, []);

  const getKey = useCallback(() => getGeminiApiKey(), []);

  const setSelectedModel = useCallback((id: string) => {
    setGeminiModelId(id);
    setModelIdState(getResolvedGeminiModel());
  }, []);

  const testConnection = useCallback(async () => {
    const key = getGeminiApiKey();
    if (!key) throw new Error("No API key");
    await generateText(
      key,
      "You are a ping service.",
      GEMINI_PING_USER,
      getResolvedGeminiModel()
    );
    return true;
  }, []);

  return {
    hasKey,
    refresh,
    saveKey,
    removeKey,
    getKey,
    testConnection,
    /** Currently selected model id (short form) */
    modelId,
    modelLabel: modelId,
    setSelectedModel,
    defaultModelId: DEFAULT_GEMINI_MODEL,
  };
}
