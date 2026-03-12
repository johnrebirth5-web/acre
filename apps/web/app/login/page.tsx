import { getDefaultAppPath } from "@acre/auth";
import { getSeededWorkspaceSnapshot } from "@acre/db";
import { getCurrentSessionContext } from "../../lib/auth-session";
import { redirect } from "next/navigation";
import { SiteReleaseBadge } from "../site-release-badge";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const context = await getCurrentSessionContext();

  if (context) {
    redirect(getDefaultAppPath(context.currentMembership.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const seededWorkspace = await getSeededWorkspaceSnapshot().catch(() => null);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-card-copy">
          <span className="auth-eyebrow">Local Access</span>
          <h1>Acre local login</h1>
          <p>Use one of the seeded users to create a local session. This is the current development-only auth flow.</p>
          <SiteReleaseBadge className="site-release-badge-auth" />
        </div>

        <form action="/api/auth/login" className="auth-form" method="post">
          <label className="auth-field">
            <span>Email</span>
            <input autoComplete="email" defaultValue="simon@acre.com" name="email" placeholder="jane@acre.com" type="email" />
          </label>

          {params?.error ? <p className="auth-error">No active seeded user matched that email.</p> : null}

          <div className="auth-actions">
            <button className="auth-submit" type="submit">
              Log in
            </button>
          </div>
        </form>

        {seededWorkspace ? (
          <section className="auth-demo-card">
            <strong>Seeded users</strong>
            <ul>
              {seededWorkspace.memberships.map((membership) => (
                <li key={membership.membershipId}>
                  <span>
                    {membership.fullName} · {membership.role}
                  </span>
                  <code>{membership.email}</code>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </main>
  );
}
