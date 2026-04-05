/**
 * Central definitions for all Gemini prompts.
 * Default model when none is chosen in Settings; user can override via ListModels.
 */

export const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";

/** @deprecated Use DEFAULT_GEMINI_MODEL or resolved model from storage */
export const GEMINI_MODEL = DEFAULT_GEMINI_MODEL;

export const GRAMMAR_SYSTEM = `You are an expert resume editor. Analyze the resume text for grammar, spelling, clarity, and professional tone. Be concise.`;

export const GRAMMAR_USER = (plainText: string) => `Resume plain text (sections may be labeled):

"""
${plainText}
"""

Return ONLY valid JSON with this shape (no markdown fences):
{
  "grammarScore": number from 0-100 (100 = no issues),
  "issues": [
    {
      "section": string (best-guess section name or "General"),
      "original": string (exact problematic phrase from the resume if possible),
      "suggestion": string,
      "severity": "error" | "warning" | "suggestion"
    }
  ]
}`;

export const ATS_SYSTEM = `You evaluate resumes for ATS (applicant tracking system) friendliness. Be practical and specific.`;

export const ATS_USER = (plainText: string) => `Resume plain text:

"""
${plainText}
"""

Also consider these client-detected signals (may be empty): the editor should not use tables or images for body content; standard sections help parsing.

Return ONLY valid JSON:
{
  "atsScore": number 0-100,
  "tips": [
    { "title": string, "detail": string, "severity": "error" | "warning" | "info" }
  ],
  "checks": {
    "hasStandardSections": boolean,
    "keywordDensityNote": string
  }
}`;

export const RELEVANCE_SYSTEM = `You compare a resume to a job description. Output structured JSON only.`;

export const RELEVANCE_USER = (
  resumeText: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string
) => `Job title: ${jobTitle}
Company: ${companyName}

Job description:
"""
${jobDescription}
"""

Resume:
"""
${resumeText}
"""

Return ONLY valid JSON:
{
  "overall_score": number 0-100,
  "matched_keywords": string[],
  "missing_keywords": string[],
  "strengths": string[],
  "gaps": string[]
}`;

export const TAILOR_SYSTEM = `You rewrite resume content for a job application. Rules:
- Preserve factual truth: do NOT invent employers, dates, degrees, metrics, or skills the candidate does not plausibly have from the resume.
- Naturally weave in missing keywords where honest.
- Keep a professional tone.
- Output ONLY valid JSON with a TipTap-compatible document in field "content" (type "doc" with content array of nodes). Use node types: doc, heading (attrs level 1-3), paragraph, bulletList, listItem, horizontalRule, text with optional marks bold, italic, underline, link (attrs href).
- Include resumeSection nodes: { "type": "resumeSection", "attrs": { "sectionType": "summary|work|education|skills|projects|certifications|custom" }, "content": [ ... blocks ] }.
- Put the candidate name as heading level 1 at the start if present in the source.`;

export const TAILOR_USER = (
  resumeJsonString: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  matched: string[],
  missing: string[]
) => `Target role: ${jobTitle} at ${companyName}.

Job description (excerpt ok to reference):
"""
${jobDescription.slice(0, 12000)}
"""

Keywords to incorporate naturally (missing): ${JSON.stringify(missing)}
Keywords already matched (keep): ${JSON.stringify(matched)}

Current resume document (TipTap JSON):
${resumeJsonString}

Return JSON: { "title": string (short version label), "content": <TipTap JSON document> }`;

export const GEMINI_PING_USER =
  "Reply with the single word: ok";
