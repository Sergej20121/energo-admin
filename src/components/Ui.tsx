export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

export function Notice({ type = 'info', text }: { type?: 'info' | 'success' | 'error'; text?: string }) {
  if (!text) return null;
  return <div className={`notice ${type}`}>{text}</div>;
}

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="card empty-state">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

export function StatusBadge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
