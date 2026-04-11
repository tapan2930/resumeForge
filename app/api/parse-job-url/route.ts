import { NextResponse } from "next/server";
import {
  DEFAULT_GEMINI_MODEL,
  JOB_URL_PARSE_SYSTEM,
  JOB_URL_PARSE_USER,
} from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  url: string;
  geminiApiKey: string;
  modelId?: string | null;
};

function stripJsonFence(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return t.trim();
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ResumeForge/1.0; +https://example.local)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(id);
  }
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const rawUrl = body?.url?.trim();
  const key = body?.geminiApiKey?.trim();
  if (!rawUrl || !key) {
    return NextResponse.json(
      { success: false, error: "Missing url or geminiApiKey" },
      { status: 400 }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid URL" },
      { status: 400 }
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json(
      { success: false, error: "Only http(s) URLs are allowed" },
      { status: 400 }
    );
  }

  const host = parsedUrl.hostname.toLowerCase();
  let pageRes: Response;
  try {
    pageRes = await fetchWithTimeout(parsedUrl.toString(), 10_000);
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        code: aborted ? "TIMEOUT" : "FETCH_FAILED",
        error: aborted
          ? "Page took too long to load. Try pasting manually."
          : "Could not load the page. Try pasting manually.",
        fallbackPlainText: undefined,
      },
      { status: 422 }
    );
  }

  let html = "";
  try {
    html = await pageRes.text();
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: "FETCH_FAILED",
        error: "Could not read response body.",
      },
      { status: 422 }
    );
  }

  const plainText = htmlToPlainText(html);

  if (!pageRes.ok) {
    const st = pageRes.status;
    const linkedIn = host.includes("linkedin.com");
    if (linkedIn && (st === 403 || st === 429)) {
      return NextResponse.json(
        {
          success: false,
          code: "LINKEDIN_BLOCKED",
          error:
            "LinkedIn blocks direct fetching. Please copy-paste the job description manually, or open the posting in a browser and paste from there.",
        },
        { status: 422 }
      );
    }
    if (st === 401 || st === 403) {
      return NextResponse.json(
        {
          success: false,
          code: "LOGIN_REQUIRED",
          error:
            "This page requires login or blocked access. Please paste the job description manually.",
          fallbackPlainText: plainText || undefined,
        },
        { status: 422 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        code: "FETCH_FAILED",
        error: `Could not fetch page (HTTP ${st}). Try pasting manually.`,
        fallbackPlainText: plainText || undefined,
      },
      { status: 422 }
    );
  }

  const model = (body.modelId || DEFAULT_GEMINI_MODEL).replace(/^models\//, "");
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(key)}`;

  const geminiRes = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: JOB_URL_PARSE_SYSTEM }] },
      contents: [
        {
          role: "user",
          parts: [{ text: JOB_URL_PARSE_USER(plainText) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    }),
  });

  const geminiData = (await geminiRes.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (!geminiRes.ok || geminiData.error?.message) {
    return NextResponse.json(
      {
        success: false,
        code: "GEMINI_ERROR",
        error: geminiData.error?.message || "Gemini request failed",
        fallbackPlainText: plainText,
      },
      { status: 422 }
    );
  }

  const raw =
    geminiData.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";

  if (!raw.trim()) {
    return NextResponse.json(
      {
        success: false,
        code: "PARSE_FAILED",
        error: "Failed to parse job details. Try pasting manually.",
        fallbackPlainText: plainText,
      },
      { status: 422 }
    );
  }

  const cleaned = stripJsonFence(raw);
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return NextResponse.json({ success: true, data: parsed });
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: "PARSE_FAILED",
        error: "Failed to parse job details. Try pasting manually.",
        fallbackPlainText: plainText,
      },
      { status: 422 }
    );
  }
}
