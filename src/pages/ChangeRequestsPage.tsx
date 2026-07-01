import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { EmptyState, Notice, PageHeader, StatusBadge } from '../components/Ui';
import type { ChangeRequestStatus, UserChangeRequest } from '../types';

function statusText(status: ChangeRequestStatus) {
  if (status === 'PENDING') return 'На рассмотрении';
  if (status === 'APPROVED') return 'Одобрена';
  if (status === 'REJECTED') return 'Отклонена';
  return 'Отменена';
}

function statusTone(status: ChangeRequestStatus) {
  if (status === 'APPROVED') return 'success' as const;
  if (status === 'REJECTED' || status === 'CANCELLED') return 'danger' as const;
  return 'warning' as const;
}

export function ChangeRequestsPage() {
  const [requests, setRequests] = useState<UserChangeRequest[]>([]);
  const [status, setStatus] = useState<ChangeRequestStatus | ''>('PENDING');
  const [busyId, setBusyId] = useState('');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const url = useMemo(() => (status ? `/admin/change-requests?status=${status}` : '/admin/change-requests'), [status]);

  async function load() {
    const data = await apiRequest<UserChangeRequest[]>(url);
    setRequests(data);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить заявки'));
  }, [url]);

  async function review(id: string, nextStatus: 'APPROVED' | 'REJECTED') {
    try {
      setBusyId(id);
      setError('');
      setSuccess('');
      await apiRequest(`/admin/change-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, adminComment: comments[id] || undefined }),
      });
      await load();
      setSuccess(nextStatus === 'APPROVED' ? 'Заявка одобрена, данные пользователя обновлены.' : 'Заявка отклонена.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обработать заявку');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="stack">
      <PageHeader title="Заявки на изменение данных" subtitle="Пользователи не меняют договорные данные напрямую: администратор проверяет и применяет изменения." />
      <Notice type="error" text={error} />
      <Notice type="success" text={success} />

      <div className="card">
        <div className="inline-actions">
          <button className={`button ${status === 'PENDING' ? 'primary' : 'secondary'}`} onClick={() => setStatus('PENDING')}>На рассмотрении</button>
          <button className={`button ${status === '' ? 'primary' : 'secondary'}`} onClick={() => setStatus('')}>Все</button>
          <button className={`button ${status === 'APPROVED' ? 'primary' : 'secondary'}`} onClick={() => setStatus('APPROVED')}>Одобренные</button>
          <button className={`button ${status === 'REJECTED' ? 'primary' : 'secondary'}`} onClick={() => setStatus('REJECTED')}>Отклонённые</button>
        </div>
      </div>

      {!requests.length ? (
        <EmptyState title="Заявок нет" subtitle="Когда пользователь попросит изменить адрес, договор или площадь, заявка появится здесь." />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Создана</th>
                  <th>Пользователь</th>
                  <th>Текущие данные</th>
                  <th>Запрошенные изменения</th>
                  <th>Статус</th>
                  <th>Решение</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>
                      <strong>{item.user?.phone || '—'}</strong><br />
                      <span className="muted">ID: {item.userId}</span>
                    </td>
                    <td>
                      <div><strong>Адрес:</strong> {item.user?.fullAddress || '—'}</div>
                      <div><strong>Договор:</strong> {item.user?.contractNumber || '—'}</div>
                      <div><strong>Площадь:</strong> {item.user?.heatedArea ?? 0} м²</div>
                    </td>
                    <td>
                      {item.fullAddress ? <div><strong>Адрес:</strong> {item.fullAddress}</div> : null}
                      {item.contractNumber ? <div><strong>Договор:</strong> {item.contractNumber}</div> : null}
                      {typeof item.heatedArea === 'number' ? <div><strong>Площадь:</strong> {item.heatedArea} м²</div> : null}
                      {item.comment ? <div className="muted"><strong>Комментарий:</strong> {item.comment}</div> : null}
                    </td>
                    <td><StatusBadge tone={statusTone(item.status)}>{statusText(item.status)}</StatusBadge></td>
                    <td>
                      {item.status === 'PENDING' ? (
                        <div className="stack" style={{ gap: 8, minWidth: 220 }}>
                          <textarea
                            rows={2}
                            placeholder="Комментарий администратора"
                            value={comments[item.id] || ''}
                            onChange={(e) => setComments((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          />
                          <div className="inline-actions">
                            <button className="button primary" disabled={busyId === item.id} onClick={() => review(item.id, 'APPROVED')}>Одобрить</button>
                            <button className="button danger" disabled={busyId === item.id} onClick={() => review(item.id, 'REJECTED')}>Отклонить</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>{item.adminComment || '—'}</div>
                          <div className="muted">{item.reviewedBy?.phone || ''}</div>
                          <div className="muted">{item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : ''}</div>
                        </div>
                      )}
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
