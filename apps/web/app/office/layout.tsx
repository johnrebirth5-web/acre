import type { ReactNode } from "react";
import { OfficeNav } from "./office-nav";

export default function OfficeLayout({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <div className="app-grid">
        <OfficeNav />
        <div className="main-area">{children}</div>
      </div>
    </main>
  );
}
