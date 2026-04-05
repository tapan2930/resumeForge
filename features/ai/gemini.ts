"use client";

import { getResolvedGeminiModel } from "@/lib/storage";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export type GeminiModelOption = {
  /** Short id for API paths, e.g. gemini-2.0-flash */
  id: string;
  /** API resource name, e.g. models/gemini-2.0-flash */
  resourceName: string;
  displayName: string;
  description?: string;
};

function normalizeModelId(modelId: string): string {
  return modelId.replace(/^models\//, "").trim();
}

function stripJsonFence(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return t.trim();
}

/**
 * Lists models the key can use with generateContent (paginates nextPageToken).
 */
export async function listGeminiModels(
  apiKey: string
): Promise<GeminiModelOption[]> {
  const key = apiKey.trim();
  if (!key) throw new GeminiError("API key required");

  const collected: GeminiModelOption[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${BASE}/models`);
    url.searchParams.set("key", key);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.text();
      throw new GeminiError(err || res.statusText, res.status);
    }

    const data = (await res.json()) as {
      models?: {
        name?: string;
        displayName?: string;
        description?: string;
        supportedGenerationMethods?: string[];
      }[];
      nextPageToken?: string;
      error?: { message?: string };
    };

    if (data.error?.message) {
      throw new GeminiError(data.error.message);
    }

    for (const m of data.models ?? []) {
      const methods = m.supportedGenerationMethods ?? [];
      if (!methods.includes("generateContent")) continue;
      const resourceName = m.name ?? "";
      const id = normalizeModelId(resourceName);
      if (!id) continue;
      collected.push({
        id,
        resourceName,
        displayName: m.displayName?.trim() || id,
        description: m.description,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  collected.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    })
  );

  return collected;
}

export async function generateText(
  apiKey: string,
  systemInstruction: string,
  userText: string,
  modelId?: string
): Promise<string> {
  const model = normalizeModelId(modelId || getResolvedGeminiModel());
  const url = `${BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new GeminiError(err || res.statusText, res.status);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };
  if (data.error?.message) {
    throw new GeminiError(data.error.message);
  }
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";
  if (!text) {
    throw new GeminiError("Empty response from model");
  }
  return text;
}

export async function generateJson<T>(
  apiKey: string,
  systemInstruction: string,
  userText: string,
  modelId?: string
): Promise<T> {
  const raw = await generateText(
    apiKey,
    systemInstruction,
    userText,
    modelId
  );
  const cleaned = stripJsonFence(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new GeminiError("Model did not return valid JSON");
  }
}
