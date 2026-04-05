"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  dismissApiKeyBanner,
  getGeminiApiKey,
  isApiKeyBannerDismissed,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";

export function APIKeyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const has = !!getGeminiApiKey();
    const dismissed = isApiKeyBannerDismissed();
    setVisible(!has && !dismissed);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-foreground"
      role="status"
    >
      <p className="font-sans text-amber-200/95">
        Set your Gemini API Key to unlock AI features — stored locally only.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="cursor-pointer"
        >
          <Link href="/settings">Open settings</Link>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 cursor-pointer text-foreground/80 hover:text-foreground"
          aria-label="Dismiss banner"
          onClick={() => {
            dismissApiKeyBanner();
            setVisible(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
