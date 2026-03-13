"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteReleaseBadge } from "../site-release-badge";

type NavGroup = {
  title: string;
  icon: string;
  items: Array<{ label: string; href?: string }>;
};

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    icon: "◫",
    items: [
      { label: "Dashboard", href: "/office/dashboard" },
      { label: "Pipeline", href: "/office/pipeline" },
      { label: "Transactions", href: "/office/transactions" },
      { label: "Contacts", href: "/office/contacts" },
      { label: "Agents", href: "/office/agents" },
      { label: "Reports", href: "/office/reports" },
      { label: "Activity", href: "/office/activity" },
      { label: "Library", href: "/office/library" },
      { label: "Accounting", href: "/office/accounting" }
    ]
  },
  {
    title: "To Do",
    icon: "◔",
    items: [{ label: "Approve docs", href: "/office/approve-docs" }, { label: "Task list", href: "/office/tasks" }]
  },
  {
    title: "Settings",
    icon: "⚙",
    items: [
      { label: "Settings", href: "/office/settings" },
      { label: "Users", href: "/office/settings/users" },
      { label: "Teams", href: "/office/settings/teams" },
      { label: "Checklists", href: "/office/settings/checklists" },
      { label: "Fields", href: "/office/settings/fields" },
      { label: "Commission plans", href: "/office/accounting#commission-management" }
    ]
  },
  {
    title: "User",
    icon: "◉",
    items: [
      { label: "Notifications", href: "/office/notifications" },
      { label: "Account", href: "/office/account" },
      { label: "Billing", href: "/office/billing" },
      { label: "Add-ons" },
      { label: "Sign out" }
    ]
  }
];

type OfficeNavProps = {
  currentOfficeName: string;
};

export function OfficeNav({ currentOfficeName }: OfficeNavProps) {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    function syncHash() {
      setCurrentHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  function hasHashVariant(path: string) {
    return navGroups.some((group) => group.items.some((item) => item.href?.startsWith(`${path}#`)));
  }

  function isSidebarItemActive(href: string) {
    const [path, hashFragment] = href.split("#");

    if (hashFragment) {
      return pathname === path && currentHash === `#${hashFragment}`;
    }

    if (hasHashVariant(path)) {
      return pathname === path && currentHash.length === 0;
    }

    return pathname === path;
  }

  function isMobileSectionActive(href: string) {
    const path = href.split("#")[0];

    return pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <>
      <aside className="sidebar office-dashboard-sidebar">
        <div className="office-logo-panel">
          <Image
            alt="Acre New York Realty logo"
            className="office-logo-image"
            height={1404}
            priority
            src="/acre-logo-nyr.png"
            width={1175}
          />
        </div>

        <SiteReleaseBadge className="site-release-badge-office" />

        <div className="office-company-switcher">
          <strong>{currentOfficeName.toUpperCase()}</strong>
          <span>▾</span>
        </div>

        <div className="office-nav-groups">
          {navGroups.map((group) => (
            <section className="office-nav-group" key={group.title}>
              <header className="office-nav-header">
                <span>{group.icon}</span>
                <strong>{group.title}</strong>
              </header>
              <div className="office-nav-items">
                {group.items.map((item) =>
                  item.href ? (
                    <Link
                      key={item.label}
                      className={`office-nav-link${isSidebarItemActive(item.href) ? " is-active" : ""}`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    item.label === "Sign out" ? (
                      <form action="/api/auth/logout" className="office-nav-logout-form" key={item.label} method="post">
                        <button className="office-nav-link office-nav-link-button" type="submit">
                          {item.label}
                        </button>
                      </form>
                    ) : (
                      <span className="office-nav-link office-nav-link-muted" key={item.label}>
                        {item.label}
                      </span>
                    )
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <nav className="mobile-rail office-mobile-rail">
        <Link className={isMobileSectionActive("/office/dashboard") ? "is-active" : ""} href="/office/dashboard">
          Dash
        </Link>
        <Link className={isMobileSectionActive("/office/tasks") ? "is-active" : ""} href="/office/tasks">
          Tasks
        </Link>
        <Link className={isMobileSectionActive("/office/transactions") ? "is-active" : ""} href="/office/transactions">
          Trans
        </Link>
        <Link className={isMobileSectionActive("/office/agents") ? "is-active" : ""} href="/office/agents">
          Agents
        </Link>
        <Link className={isMobileSectionActive("/office/activity") ? "is-active" : ""} href="/office/activity">
          Activity
        </Link>
        <Link className={isMobileSectionActive("/office/library") ? "is-active" : ""} href="/office/library">
          Library
        </Link>
        <Link className={isMobileSectionActive("/office/accounting") ? "is-active" : ""} href="/office/accounting">
          Acct
        </Link>
        <Link className={isMobileSectionActive("/office/settings") ? "is-active" : ""} href="/office/settings">
          Admin
        </Link>
      </nav>
    </>
  );
}
