"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  listAllVersions,
  listAllTemplates,
  deleteVersion,
  deleteTemplate,
} from "@/lib/idb";
import { loadFoldersFromStorage, FOLDERS_STORAGE_KEY } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { syncUser } from "@/lib/actions/user.actions";

export function SyncModal() {
  const [open, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    void (async () => {
      const folders = loadFoldersFromStorage();
      if (folders.length > 0) {
        setImportOpen(true);
      }
    })();
  }, []);

  const onSync = async () => {
    setLoading(true);
    try {
      // 1. Ensure user is synced to DB first (FK requirement)
      await syncUser();

      const localFolders = loadFoldersFromStorage();
      const localResumes = await listAllVersions();
      const localTemplates = await listAllTemplates();

      const addFolder = useAppStore.getState().addFolder;
      const addVersion = useAppStore.getState().addVersion;
      const importTemplate = useAppStore.getState().importCustomTemplate;

      // 2. Upload everything
      for (const f of localFolders) {
        const newFolder = await addFolder(f.name, f.color);
        const folderResumes = localResumes.filter((r) => r.folderId === f.id);
        for (const r of folderResumes) {
          await addVersion(newFolder.id, {
            title: r.title,
            content: r.content,
            template: r.template,
          });
        }
      }

      for (const t of localTemplates) {
        await importTemplate(t);
      }

      // 3. Cleanup local storage only after successful upload
      for (const r of localResumes) {
        await deleteVersion(r.id);
      }
      for (const t of localTemplates) {
        await deleteTemplate(t.id);
      }
      localStorage.removeItem(FOLDERS_STORAGE_KEY);

      toast.success("Data synced to cloud successfully!");
      setImportOpen(false);
      await hydrate();
    } catch (e) {
      console.error("Migration error:", e);
      const msg = e instanceof Error ? e.message : "Migration failed";
      toast.error(`${msg}. Ensure your database is initialized.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setImportOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CloudUpload className="h-5 w-5 text-primary" />
            Sync local data to cloud?
          </DialogTitle>
          <DialogDescription>
            We detected resume data stored locally in your browser. Would you
            like to move it to your new cloud account so you can access it from
            any device?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            type="button"
            className="cursor-pointer gap-2"
            onClick={() => void onSync()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="h-4 w-4" />
            )}
            Move to Cloud
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="cursor-pointer"
            onClick={() => setImportOpen(false)}
            disabled={loading}
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
