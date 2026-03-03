import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />

      {/* Main content area */}
      <main
        className="lg:pl-56 pb-20 lg:pb-0"
        style={{ minHeight: "100vh" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6 lg:px-6">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
