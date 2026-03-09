import type { ReactNode } from "react";

export function Badge(props: { tone?: "neutral" | "accent" | "success"; children: ReactNode }) {
  const tone = props.tone ?? "neutral";
  return <span className={`acre-badge acre-badge-${tone}`}>{props.children}</span>;
}

export function Panel(props: { title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="acre-panel">
      {(props.title || props.actions) && (
        <header className="acre-panel-header">
          <div>
            {props.title && <h3>{props.title}</h3>}
            {props.subtitle && <p>{props.subtitle}</p>}
          </div>
          {props.actions && <div className="acre-panel-actions">{props.actions}</div>}
        </header>
      )}
      <div className="acre-panel-body">{props.children}</div>
    </section>
  );
}

export function StatCard(props: { label: string; value: string; hint?: string }) {
  return (
    <article className="acre-stat-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      {props.hint && <p>{props.hint}</p>}
    </article>
  );
}
