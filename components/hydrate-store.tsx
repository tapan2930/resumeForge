"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

export function HydrateStore() {
  const hydrate = useAppStore((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return null;
}
