"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { agentSections } from "@acre/backoffice";

function AgentBadge({ children }: { children: ReactNode }) {
  return <span className="acre-badge acre-badge-accent">{children}</span>;
}

export function AgentNav() {
  const pathname = usePathname();
  const items = agentSections[0].items;

  return (
    <>
      <aside className="sidebar">
        <div className="brand-mark">
          <span>Acre</span>
          <strong>Agent OS</strong>
          <p>Field-ready workspace for listings, CRM follow-up, events, and knowledge tools.</p>
        </div>

        <div className="nav-group">
          <h2>{agentSections[0].title}</h2>
          <p>{agentSections[0].summary}</p>
          <div className="nav-items">
            {items.map((item) => (
              <Link key={item.href} className={`nav-card${pathname === item.href ? " is-active" : ""}`} href={item.href}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="sidebar-note">
          <AgentBadge>Mobile-safe</AgentBadge>
          <strong>Same workflows, reduced chrome.</strong>
          <p>The mobile view keeps primary actions one tap away using a compact bottom rail.</p>
        </div>
      </aside>

      <nav className="mobile-rail">
        {items.map((item) => (
          <Link key={item.href} className={pathname === item.href ? "is-active" : ""} href={item.href}>
            {item.shortLabel}
          </Link>
        ))}
      </nav>
    </>
  );
}
