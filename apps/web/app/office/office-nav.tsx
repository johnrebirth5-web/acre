"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
      { label: "Reports", href: "/office/reports" },
      { label: "Activity", href: "/office/activity" },
      { label: "Library", href: "/office/library" },
      { label: "Accounting", href: "/office/accounting" }
    ]
  },
  {
    title: "To Do",
    icon: "◔",
    items: [{ label: "Approve docs" }, { label: "Task list" }]
  },
  {
    title: "Settings",
    icon: "⚙",
    items: [
      { label: "Company", href: "/office/company" },
      { label: "Users" },
      { label: "Checklists" },
      { label: "Fields" },
      { label: "Commission plans" }
    ]
  },
  {
    title: "User",
    icon: "◉",
    items: [{ label: "Notifications" }, { label: "Account" }, { label: "Billing" }, { label: "Add-ons" }, { label: "Sign out" }]
  }
];

type OfficeNavProps = {
  currentOfficeName: string;
};

export function OfficeNav({ currentOfficeName }: OfficeNavProps) {
  const pathname = usePathname();

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

        <div className="office-company-switcher">
          <strong>{currentOfficeName.toUpperCase()}</strong>
          <span>▾</span>
        </div>

        <div className="office-bm-groups">
          {navGroups.map((group) => (
            <section className="office-bm-group" key={group.title}>
              <header className="office-bm-header">
                <span>{group.icon}</span>
                <strong>{group.title}</strong>
              </header>
              <div className="office-bm-items">
                {group.items.map((item) =>
                  item.href ? (
                    <Link
                      key={item.label}
                      className={`office-bm-link${pathname === item.href ? " is-active" : ""}`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    item.label === "Sign out" ? (
                      <form action="/api/auth/logout" className="office-bm-logout-form" key={item.label} method="post">
                        <button className="office-bm-link office-bm-link-button" type="submit">
                          {item.label}
                        </button>
                      </form>
                    ) : (
                      <span className="office-bm-link office-bm-link-muted" key={item.label}>
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
        <Link className={pathname === "/office/dashboard" ? "is-active" : ""} href="/office/dashboard">
          Dash
        </Link>
        <Link className={pathname === "/office/transactions" ? "is-active" : ""} href="/office/transactions">
          Trans
        </Link>
        <Link className={pathname === "/office/activity" ? "is-active" : ""} href="/office/activity">
          Activity
        </Link>
        <Link className={pathname === "/office/library" ? "is-active" : ""} href="/office/library">
          Library
        </Link>
        <Link className={pathname === "/office/accounting" ? "is-active" : ""} href="/office/accounting">
          Acct
        </Link>
      </nav>
    </>
  );
}
