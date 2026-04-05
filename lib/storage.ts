/**
 * Folder persistence (localStorage).
 * Future: swap for Supabase sync — keep the same function signatures.
 */
import type { ResumeFolder } from "@/lib/types";
import { DEFAULT_GEMINI_MODEL } from "@/lib/prompts";

export const FOLDERS_STORAGE_KEY = "resumeforge_folders_v1";
export const GEMINI_KEY_STORAGE = "resumeforge_gemini_api_key";
/** Short model id for generateContent, e.g. gemini-1.5-flash (no models/ prefix). */
export const GEMINI_MODEL_STORAGE_KEY = "resumeforge_gemini_model_id";
export const API_KEY_BANNER_DISMISSED = "resumeforge_api_banner_dismissed";
export const THEME_STORAGE_KEY = "resumeforge_theme"; // "dark" | "light"

export function loadFoldersFromStorage(): ResumeFolder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ResumeFolder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFoldersToStorage(folders: ResumeFolder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  } catch {
    /* quota */
  }
}

export function getGeminiApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GEMINI_KEY_STORAGE);
}

export function setGeminiApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GEMINI_KEY_STORAGE, key);
}

export function clearGeminiApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GEMINI_KEY_STORAGE);
}

export function getGeminiModelId(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
  return v?.trim() ? v.trim() : null;
}

export function setGeminiModelId(modelId: string): void {
  if (typeof window === "undefined") return;
  const id = modelId.replace(/^models\//, "").trim();
  if (!id) return;
  localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, id);
}

export function clearGeminiModelId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GEMINI_MODEL_STORAGE_KEY);
}

/** Model id passed to the Generative Language API (generateContent). */
export function getResolvedGeminiModel(): string {
  return getGeminiModelId() ?? DEFAULT_GEMINI_MODEL;
}

export function isApiKeyBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(API_KEY_BANNER_DISMISSED) === "1";
}

export function dismissApiKeyBanner(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_KEY_BANNER_DISMISSED, "1");
}
