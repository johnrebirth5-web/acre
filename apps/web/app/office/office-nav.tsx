"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { officeSections } from "@acre/backoffice";

export function OfficeNav() {
  const pathname = usePathname();
  const items = officeSections[0].items;

  return (
    <>
      <aside className="sidebar">
        <div className="brand-mark">
          <span>Acre</span>
          <strong>Office Console</strong>
          <p>Command surface for listings, shared resources, events, analytics, and publishing controls.</p>
        </div>

        <div className="nav-group">
          <h2>{officeSections[0].title}</h2>
          <p>{officeSections[0].summary}</p>
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
          <span className="acre-badge acre-badge-accent">Operations view</span>
          <strong>One inventory core, multiple outputs.</strong>
          <p>Listings data in this console will later feed both agent workflows and public-facing web surfaces.</p>
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
