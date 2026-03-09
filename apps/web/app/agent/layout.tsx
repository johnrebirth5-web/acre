import type { ReactNode } from "react";
import { AgentNav } from "./agent-nav";

export default function AgentLayout({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <div className="app-grid">
        <AgentNav />
        <div className="main-area">{children}</div>
      </div>
    </main>
  );
}
