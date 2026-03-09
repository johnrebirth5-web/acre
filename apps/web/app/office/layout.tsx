import type { ReactNode } from "react";
import { OfficeNav } from "./office-nav";

export default function OfficeLayout({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell office-dashboard-shell">
      <div className="app-grid office-dashboard-grid-shell">
        <OfficeNav />
        <div className="main-area office-dashboard-main">{children}</div>
      </div>
    </main>
  );
}
