import type { JSONContent } from "@tiptap/core";

export function tiptapToPlainText(doc: JSONContent | undefined): string {
  if (!doc) return "";
  const parts: string[] = [];

  function walk(node: JSONContent) {
    if (node.type === "text" && node.text) {
      parts.push(node.text);
    }
    if (node.type === "heading") {
      parts.push("\n## ");
    }
    if (node.type === "paragraph" || node.type === "listItem") {
      parts.push("\n");
    }
    if (node.type === "bulletList" || node.type === "orderedList") {
      parts.push("\n");
    }
    if (node.type === "horizontalRule") {
      parts.push("\n---\n");
    }
    if (node.type === "resumeSection") {
      parts.push("\n[Section]\n");
    }
    node.content?.forEach(walk);
  }

  walk(doc);
  return parts.join("").replace(/\n{3,}/g, "\n\n").trim();
}

export function replaceFirstTextInDoc(
  doc: JSONContent,
  original: string,
  replacement: string
): JSONContent {
  let done = false;

  function walk(node: JSONContent): JSONContent {
    if (
      !done &&
      node.type === "text" &&
      node.text &&
      node.text.includes(original)
    ) {
      done = true;
      return {
        ...node,
        text: node.text.replace(original, replacement),
      };
    }
    if (node.content?.length) {
      return {
        ...node,
        content: node.content.map(walk),
      };
    }
    return node;
  }

  return walk(JSON.parse(JSON.stringify(doc)) as JSONContent);
}

export function getTopLevelResumeSectionIndices(doc: JSONContent): number[] {
  if (!doc.content) return [];
  const idx: number[] = [];
  doc.content.forEach((node, i) => {
    if (node.type === "resumeSection") idx.push(i);
  });
  return idx;
}

export function moveTopLevelBlock(
  doc: JSONContent,
  fromIndex: number,
  toIndex: number
): JSONContent {
  if (!doc.content) return doc;
  const content = [...doc.content];
  if (
    fromIndex < 0 ||
    fromIndex >= content.length ||
    toIndex < 0 ||
    toIndex >= content.length
  ) {
    return doc;
  }
  const [item] = content.splice(fromIndex, 1);
  content.splice(toIndex, 0, item);
  return { ...doc, content };
}

export function swapTopLevelBlocks(
  doc: JSONContent,
  i: number,
  j: number
): JSONContent {
  if (!doc.content || i === j) return doc;
  const content = [...doc.content];
  if (i < 0 || j < 0 || i >= content.length || j >= content.length) return doc;
  [content[i], content[j]] = [content[j], content[i]];
  return { ...doc, content };
}

/** Heuristic: detect table tags if HTML ever passed (editor HTML). */
export function clientAtsSignals(html: string): { hasTable: boolean } {
  return { hasTable: /<table[\s>]/i.test(html) };
}
