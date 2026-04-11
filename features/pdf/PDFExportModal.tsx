"use client";

import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { PaperSize, ResumeTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PDFExportModal({
  open,
  onOpenChange,
  content,
  template,
  defaultFileName,
  headerName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  content: JSONContent;
  template: ResumeTemplate;
  defaultFileName: string;
  headerName: string;
}) {
  const [paperSize, setPaperSize] = useState<PaperSize>("letter");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(false);
  const [includeSectionDividers, setIncludeSectionDividers] = useState(true);
  const [fileName, setFileName] = useState(defaultFileName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setFileName(defaultFileName);
  }, [open, defaultFileName]);

  const download = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          template,
          paperSize,
          includeHeader,
          includePageNumbers,
          includeSectionDividers,
          headerName,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="pdf-export-desc">
        <DialogHeader>
          <DialogTitle>Export PDF</DialogTitle>
          <DialogDescription id="pdf-export-desc">
            Renders your preview as a text-selectable PDF. On macOS/Windows, the
            app uses Google Chrome, Brave, or Chromium if installed. On Linux
            serverless (e.g. Vercel), it uses bundled Chromium. Override with
            CHROME_EXECUTABLE_PATH if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <span className="text-sm font-medium">Paper size</span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={paperSize === "letter" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPaperSize("letter")}
              >
                Letter
              </Button>
              <Button
                type="button"
                size="sm"
                variant={paperSize === "a4" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPaperSize("a4")}
              >
                A4
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="pdf-header"
              checked={includeHeader}
              onCheckedChange={(v) => setIncludeHeader(!!v)}
              aria-label="Include header with name"
            />
            <Label htmlFor="pdf-header" className="cursor-pointer font-normal">
              Header with name &amp; contact strip
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="pdf-pages"
              checked={includePageNumbers}
              onCheckedChange={(v) => setIncludePageNumbers(!!v)}
              aria-label="Include page numbers"
            />
            <Label htmlFor="pdf-pages" className="cursor-pointer font-normal">
              Page numbers
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="pdf-dividers"
              checked={includeSectionDividers}
              onCheckedChange={(v) => setIncludeSectionDividers(!!v)}
              aria-label="Include section dividers"
            />
            <Label htmlFor="pdf-dividers" className="cursor-pointer font-normal">
              Section dividers in body
            </Label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pdf-filename">File name</Label>
            <Input
              id="pdf-filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer gap-2"
            onClick={() => void download()}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
