import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { EmptyState, Notice, PageHeader, StatusBadge } from '../components/Ui';
import type { AuditLog } from '../types';

function pretty(value: unknown) {
  if (!value) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [take, setTake] = useState(100);
  const [action, setAction] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  async function load() {
    const params = new URLSearchParams({ take: String(take) });
    if (action.trim()) params.set('action', action.trim());
    const data = await apiRequest<AuditLog[]>(`/admin/audit-logs?${params.toString()}`);
    setItems(data);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить аудит'));
  }, []);

  return (
    <div className="stack">
      <PageHeader title="Аудит действий" subtitle="Журнал административных и чувствительных операций: кто, когда и какой endpoint вызвал." />
      <Notice type="error" text={error} />

      <div className="card form-grid">
        <div className="grid two">
          <div className="field">
            <label>Поиск по действию / endpoint</label>
            <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Например, /admin/users" />
          </div>
          <div className="field">
            <label>Количество строк</label>
            <input type="number" min="1" max="500" value={take} onChange={(e) => setTake(Number(e.target.value) || 100)} />
          </div>
        </div>
        <div><button className="button primary" onClick={() => load().catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить аудит'))}>Обновить</button></div>
      </div>

      {!items.length ? (
        <EmptyState title="Записей аудита нет" subtitle="Новые изменения в админке начнут попадать сюда автоматически." />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Администратор</th>
                  <th>Действие</th>
                  <th>Статус</th>
                  <th>IP / устройство</th>
                  <th>Детали</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>
                      <strong>{item.actorPhone || 'Система/неизвестно'}</strong><br />
                      <span className="muted">{item.actorRole || '—'}</span>
                    </td>
                    <td>
                      <strong>{item.method}</strong> {item.path}
                      {item.error ? <div className="muted">Ошибка: {item.error}</div> : null}
                    </td>
                    <td><StatusBadge tone={item.statusCode && item.statusCode >= 400 ? 'danger' : 'success'}>{item.statusCode || '—'}</StatusBadge></td>
                    <td>
                      <div>{item.ip || '—'}</div>
                      <div className="muted" style={{ maxWidth: 280 }}>{item.userAgent || '—'}</div>
                    </td>
                    <td>
                      <button className="button secondary" onClick={() => setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}>
                        {expanded[item.id] ? 'Скрыть' : 'Показать'}
                      </button>
                      {expanded[item.id] ? (
                        <pre className="code-block">{pretty({ request: item.request, response: item.response })}</pre>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
