import type { JSONContent } from "@tiptap/core";

export function extractResumeName(content: JSONContent): string {
  const first = content.content?.[0];
  if (first?.type === "heading" && first.attrs?.level === 1) {
    const t = first.content?.find((n) => n.type === "text") as
      | { text?: string }
      | undefined;
    if (t?.text?.trim()) return t.text.trim();
  }
  return "Candidate";
}
