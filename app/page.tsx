import { AppShell } from "@/components/app-shell";
import { RecentResumes } from "@/features/resume/RecentResumes";
import { VersionList } from "@/features/resume/VersionList";
import { CommandPaletteHost } from "@/components/command-palette";
import { SyncModal } from "@/features/cloud/SyncModal";

export default function DashboardPage() {
  return (
    <AppShell>
      <CommandPaletteHost />
      <SyncModal />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Organize versions by role, then open the editor for live preview and
            PDF export.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-6 pb-0">
            <RecentResumes />
          </div>
          <VersionList />
        </div>
      </div>
    </AppShell>
  );
}
