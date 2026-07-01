import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { EmptyState, Notice, PageHeader, StatusBadge } from '../components/Ui';
import type { MeterReplacement, RequestStatus, SealRequest } from '../types';

const labels: Record<RequestStatus, string> = {
  CREATED: 'Создана',
  IN_REVIEW: 'На рассмотрении',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
  COMPLETED: 'Завершена',
};

function tone(status: RequestStatus) {
  if (status === 'APPROVED' || status === 'COMPLETED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
}

export function RequestsPage() {
  const [sealRequests, setSealRequests] = useState<SealRequest[]>([]);
  const [replacementRequests, setReplacementRequests] = useState<MeterReplacement[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState('');

  async function loadData() {
    const [sealData, replacementData] = await Promise.all([
      apiRequest<SealRequest[]>('/admin/seal-requests'),
      apiRequest<MeterReplacement[]>('/admin/meter-replacements'),
    ]);
    setSealRequests(sealData);
    setReplacementRequests(replacementData);
  }

  useEffect(() => {
    loadData().catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить заявки'));
  }, []);

  async function updateStatus(type: 'seal' | 'replacement', id: string, status: 'APPROVED' | 'COMPLETED' | 'REJECTED') {
    try {
      setBusyId(id);
      setError('');
      setSuccess('');
      const path = type === 'seal' ? `/admin/seal-requests/${id}/status` : `/admin/meter-replacements/${id}/status`;
      await apiRequest(path, { method: 'PATCH', body: JSON.stringify({ status }) });
      await loadData();
      setSuccess('Статус заявки обновлён.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить статус');
    } finally {
      setBusyId('');
    }
  }

  const actionsByStatus: Record<RequestStatus, Array<'APPROVED' | 'COMPLETED' | 'REJECTED'>> = {
    CREATED: ['APPROVED', 'REJECTED'],
    IN_REVIEW: ['APPROVED', 'REJECTED'],
    APPROVED: ['COMPLETED'],
    REJECTED: [],
    COMPLETED: [],
  };

  function renderActions(itemId: string, status: RequestStatus, type: 'seal' | 'replacement') {
    const actions = actionsByStatus[status] || [];
    if (!actions.length) return <span className="muted">Действий нет</span>;

    return (
      <div className="actions-row">
        {actions.includes('APPROVED') ? <button className="button primary" disabled={busyId === itemId} onClick={() => updateStatus(type, itemId, 'APPROVED')}>Одобрить</button> : null}
        {actions.includes('COMPLETED') ? <button className="button secondary" disabled={busyId === itemId} onClick={() => updateStatus(type, itemId, 'COMPLETED')}>Завершить</button> : null}
        {actions.includes('REJECTED') ? <button className="button danger" disabled={busyId === itemId} onClick={() => updateStatus(type, itemId, 'REJECTED')}>Отклонить</button> : null}
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader title="Заявки" subtitle="Пломбировка и замена счётчиков в одной панели." />
      <Notice type="error" text={error} />
      <Notice type="success" text={success} />

      <div className="card">
        <h2 className="section-title">Пломбировка</h2>
        {!sealRequests.length ? (
          <EmptyState title="Нет заявок" subtitle="По пломбировке пока ничего нет." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Адрес</th>
                  <th>Счётчик</th>
                  <th>Дата / комментарий</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {sealRequests.map((item) => (
                  <tr key={item.id}>
                    <td>{item.user?.phone || '—'}</td>
                    <td>{item.user?.fullAddress || '—'}</td>
                    <td>{item.meter ? `${item.meter.title} / ${item.meter.serialNumber}` : '—'}</td>
                    <td>
                      <div>{item.preferredDate ? new Date(item.preferredDate).toLocaleDateString() : '—'}</div>
                      <div className="muted">{item.comment || 'Без комментария'}</div>
                    </td>
                    <td><StatusBadge tone={tone(item.status)}>{labels[item.status]}</StatusBadge></td>
                    <td>{renderActions(item.id, item.status, 'seal')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Замена счётчиков</h2>
        {!replacementRequests.length ? (
          <EmptyState title="Нет заявок" subtitle="По замене счётчиков пока ничего нет." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Адрес</th>
                  <th>Старый / новый счётчик</th>
                  <th>Причина</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {replacementRequests.map((item) => (
                  <tr key={item.id}>
                    <td>{item.user?.phone || '—'}</td>
                    <td>{item.user?.fullAddress || '—'}</td>
                    <td>
                      <div>{item.oldMeter ? `${item.oldMeter.title} / ${item.oldMeter.serialNumber}` : '—'}</div>
                      <div className="muted">Новый: {item.newTitle} / {item.newSerialNumber}, старт {item.initialReading}</div>
                    </td>
                    <td>{item.reason}</td>
                    <td><StatusBadge tone={tone(item.status)}>{labels[item.status]}</StatusBadge></td>
                    <td>{renderActions(item.id, item.status, 'replacement')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
