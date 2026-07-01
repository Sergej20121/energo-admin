import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Notice, PageHeader, StatCard, StatusBadge } from '../components/Ui';
import type { Dashboard } from '../types';

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU');
}

export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<Dashboard>('/admin/dashboard')
      .then((response) => {
        setData(response);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить дашборд'));
  }, []);

  return (
    <div className="stack">
      <PageHeader title="Дашборд" subtitle="Расширенная сводка для локального запуска: пользователи, оплаты, показания и последние события." />
      <Notice type="error" text={error} />

      <div className="grid stats">
        <StatCard label="Пользователи" value={data?.users ?? '—'} hint={`Активных: ${data?.activeUsers ?? '—'} · Заблокированных: ${data?.blockedUsers ?? '—'}`} />
        <StatCard label="Новых за месяц" value={data?.newUsersThisMonth ?? '—'} />
        <StatCard label="Активные счётчики" value={data?.activeMeters ?? '—'} />
        <StatCard label="Открытые заявки" value={data?.openRequests ?? '—'} />
        <StatCard label="Ожидают оплаты" value={data?.pendingPayments ?? '—'} />
        <StatCard label="Просроченные оплаты" value={data?.overduePayments ?? '—'} hint="Просрочка считается автоматически после 10 числа." />
        <StatCard label="Оплаченные счета" value={data?.paidPayments ?? '—'} />
        <StatCard label="Оплачено всего" value={data ? formatMoney(data.totalPaidAmount) : '—'} />
        <StatCard label="Текущий долг" value={data ? formatMoney(data.totalDebtAmount) : '—'} />
        <StatCard label="Показаний сегодня" value={data?.readingsToday ?? '—'} />
        <StatCard label="Показаний за месяц" value={data?.readingsThisMonth ?? '—'} />
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>Последние оплаты</h3>
          {data?.recentPayments?.length ? (
            <div className="stack compact">
              {data.recentPayments.map((item) => (
                <div key={item.id} className="list-row">
                  <div>
                    <div><strong>{item.user?.fullAddress || item.user?.phone || 'Пользователь'}</strong></div>
                    <div className="muted">{item.billingMonth} · {item.user?.contractNumber || '—'} · {formatDate(item.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>{formatMoney(item.amount)}</strong></div>
                    <StatusBadge tone={item.status === 'PAID' ? 'success' : item.status === 'OVERDUE' ? 'danger' : 'warning'}>{item.status}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="muted">Пока нет данных по последним оплатам.</p>}
        </div>

        <div className="card">
          <h3>Последние показания</h3>
          {data?.recentReadings?.length ? (
            <div className="stack compact">
              {data.recentReadings.map((item) => (
                <div key={item.id} className="list-row">
                  <div>
                    <div><strong>{item.meter.title}</strong></div>
                    <div className="muted">{item.meter.serialNumber} · {item.meter.user?.fullAddress || item.meter.user?.phone || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>{item.value}</strong></div>
                    <div className="muted">{formatDate(item.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="muted">Пока нет новых показаний.</p>}
        </div>
      </div>
    </div>
  );
}
