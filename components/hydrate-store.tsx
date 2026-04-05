"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

export function HydrateStore() {
  const hydrate = useAppStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}
