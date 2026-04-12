"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTopLevelResumeSectionIndices,
  swapTopLevelBlocks,
  moveTopLevelBlock,
} from "@/lib/tiptap-helpers";
import type { JSONContent } from "@tiptap/core";
import { cn } from "@/lib/utils";

export function SectionOutline({ editor }: { editor: Editor | null }) {
  const [dragged, setDragged] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  if (!editor) return null;

  const doc = editor.getJSON() as JSONContent;
  const indices = getTopLevelResumeSectionIndices(doc);
  if (indices.length === 0) return null;

  const swap = (a: number, b: number) => {
    const next = swapTopLevelBlocks(doc, a, b);
    editor.commands.setContent(next, false);
  };

  const move = (from: number, to: number) => {
    const next = moveTopLevelBlock(doc, from, to);
    editor.commands.setContent(next, false);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 bg-card/50"
      role="region"
      aria-label="Section order"
    >
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        Sections
      </span>
      {indices.map((blockIndex, i) => {
        const node = doc.content?.[blockIndex];
        const headingNode = node?.content?.find((n) => n.type === "heading");
        const title =
          headingNode?.content?.[0]?.type === "text"
            ? String((headingNode.content[0] as { text?: string }).text ?? "Section")
            : "Section";
        const prevIdx = i > 0 ? indices[i - 1] : null;
        const nextIdx = i < indices.length - 1 ? indices[i + 1] : null;
        
        return (
          <div
            key={`${blockIndex}-${i}`}
            draggable
            onDragStart={(e) => {
              setDragged(blockIndex);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", blockIndex.toString());
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOver !== blockIndex) {
                setDragOver(blockIndex);
              }
            }}
            onDragLeave={() => {
              if (dragOver === blockIndex) setDragOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              if (dragged !== null && dragged !== blockIndex) {
                move(dragged, blockIndex);
              }
              setDragged(null);
            }}
            onDragEnd={() => {
              setDragged(null);
              setDragOver(null);
            }}
            className={cn(
              "flex items-center gap-1 rounded-md border border-border bg-background px-1 py-1 transition-colors cursor-grab active:cursor-grabbing",
              dragOver === blockIndex && "border-primary bg-primary/10 scale-105 shadow-sm",
              dragged === blockIndex && "opacity-50 border-dashed"
            )}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="max-w-[120px] truncate text-xs font-medium pl-1 pr-2">
              {title}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={`Move section ${title} up among sections`}
              onClick={() => prevIdx !== null && swap(blockIndex, prevIdx)}
              disabled={prevIdx === null}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={`Move section ${title} down among sections`}
              onClick={() => nextIdx !== null && swap(blockIndex, nextIdx)}
              disabled={nextIdx === null}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
