"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Moon, RefreshCw, Sun, Upload } from "lucide-react";
import { useGemini } from "@/features/ai/useGemini";
import {
  listGeminiModels,
  type GeminiModelOption,
} from "@/features/ai/gemini";
import {
  THEME_STORAGE_KEY,
  saveFoldersToStorage,
  loadFoldersFromStorage,
  getGeminiApiKey,
} from "@/lib/storage";
import { importVersions, listAllVersions } from "@/lib/idb";
import { useAppStore } from "@/stores/useAppStore";
import type { ResumeFolder, ResumeVersion } from "@/lib/types";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const {
    hasKey,
    saveKey,
    removeKey,
    testConnection,
    modelId,
    setSelectedModel,
    defaultModelId,
    refresh,
  } = useGemini();
  const hydrate = useAppStore((s) => s.hydrate);
  const [keyInput, setKeyInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [models, setModels] = useState<GeminiModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = localStorage.getItem(THEME_STORAGE_KEY) as "dark" | "light" | null;
    const initial = t === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.classList.toggle("light", initial === "light");
  }, []);

  const applyTheme = useCallback((t: "dark" | "light") => {
    setTheme(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
    document.documentElement.classList.toggle("light", t === "light");
  }, []);

  const selectOptions = useMemo(() => {
    const byId = new Map<string, GeminiModelOption>();
    for (const m of models) {
      byId.set(m.id, m);
    }
    if (!byId.has(modelId)) {
      byId.set(modelId, {
        id: modelId,
        resourceName: `models/${modelId}`,
        displayName: `${modelId} (saved)`,
      });
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
      })
    );
  }, [models, modelId]);

  const fetchModels = useCallback(async () => {
    const key = getGeminiApiKey();
    if (!key) {
      toast.error("Save an API key first, then load models.");
      return;
    }
    setLoadingModels(true);
    try {
      const list = await listGeminiModels(key);
      setModels(list);
      toast.success(`Loaded ${list.length} models with generateContent`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to list models");
    } finally {
      setLoadingModels(false);
    }
  }, []);

  const onExport = async () => {
    try {
      const folders = loadFoldersFromStorage();
      const versions = await listAllVersions();
      const blob = new Blob(
        [JSON.stringify({ folders, versions }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resumeforge-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  const onImportFile = async (f: File | null) => {
    if (!f) return;
    try {
      const text = await f.text();
      const data = JSON.parse(text) as {
        folders?: ResumeFolder[];
        versions?: ResumeVersion[];
      };
      if (!data.folders || !data.versions) {
        throw new Error("Invalid backup file");
      }
      saveFoldersToStorage(data.folders);
      await importVersions(data.versions, false);
      hydrate();
      toast.success("Data imported. Reload recommended.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-xl flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="cursor-pointer gap-1"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            API keys stay in this browser only. For team sync, a future Supabase
            backend can replace local storage.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gemini API</CardTitle>
            <CardDescription>
              Keys and model choice are stored in{" "}
              <code className="text-xs bg-muted px-1 rounded">localStorage</code>{" "}
              only. Default model is{" "}
              <span className="font-mono text-foreground">{defaultModelId}</span>{" "}
              until you pick another.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="gemini-key">API key</Label>
              <Input
                id="gemini-key"
                type="password"
                autoComplete="off"
                placeholder={hasKey ? "••••••••" : "Paste key"}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="cursor-pointer"
                onClick={() => {
                  if (!keyInput.trim()) {
                    toast.error("Enter a key first");
                    return;
                  }
                  saveKey(keyInput.trim());
                  refresh();
                  setKeyInput("");
                  toast.success("API key saved locally");
                }}
              >
                Save key
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="cursor-pointer gap-2"
                disabled={testing}
                onClick={async () => {
                  setTesting(true);
                  try {
                    await testConnection();
                    toast.success("Connection OK");
                  } catch (e) {
                    toast.error(
                      e instanceof Error ? e.message : "Connection failed"
                    );
                  } finally {
                    setTesting(false);
                  }
                }}
              >
                {testing && <Loader2 className="h-4 w-4 animate-spin" />}
                Test connection
              </Button>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  removeKey();
                  refresh();
                  setModels([]);
                  toast.message("API key cleared");
                }}
              >
                Clear key
              </Button>
            </div>

            <div className="grid gap-2 pt-2 border-t border-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="gemini-model">Model</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer gap-2 h-8"
                  disabled={!hasKey || loadingModels}
                  onClick={() => void fetchModels()}
                  aria-label="Load models from Google API"
                >
                  {loadingModels ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Load models
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Uses the Generative Language API{" "}
                <code className="text-[10px] bg-muted px-1 rounded">models.list</code>
                . Only models that support{" "}
                <code className="text-[10px] bg-muted px-1 rounded">
                  generateContent
                </code>{" "}
                are shown.
              </p>
              <select
                id="gemini-model"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer transition-colors duration-200"
                value={modelId}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                }}
                aria-label="Gemini model for AI features"
              >
                {selectOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
              {models.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Click &quot;Load models&quot; after saving your key to populate
                  the list, or keep the default until then.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Dark is the default craft workspace; light preview paper stays in
              the editor.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={theme === "dark" ? "default" : "outline"}
              className="cursor-pointer gap-2"
              onClick={() => applyTheme("dark")}
              aria-pressed={theme === "dark"}
            >
              <Moon className="h-4 w-4" />
              Dark chrome
            </Button>
            <Button
              type="button"
              variant={theme === "light" ? "default" : "outline"}
              className="cursor-pointer gap-2"
              onClick={() => applyTheme("light")}
              aria-pressed={theme === "light"}
            >
              <Sun className="h-4 w-4" />
              Light chrome
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data backup</CardTitle>
            <CardDescription>
              Export folders + all resume versions as JSON. Import replaces
              IndexedDB versions and folder list.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
              onClick={() => void onExport()}
            >
              Export JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-hidden
              onChange={(e) => void onImportFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer gap-2"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import JSON
            </Button>
          </CardContent>
        </Card>

        <Separator />
        <p className="text-xs text-muted-foreground">
          Folders: {loadFoldersFromStorage().length} in localStorage · IndexedDB
          holds full resume documents.
        </p>
      </div>
    </AppShell>
  );
}
