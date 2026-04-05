import { APIKeyBanner } from "@/features/settings/APIKeyBanner";
import { Sidebar } from "@/features/folder/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen min-h-0 flex-col bg-background text-foreground">
      <APIKeyBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-h-0 min-w-0 flex-1 flex flex-col bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
