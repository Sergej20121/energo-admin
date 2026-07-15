import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { EmptyState, Notice, PageHeader, StatusBadge } from '../components/Ui';
import { exportToExcel } from '../utils/exportExcel';
import type { Payment, PaymentStatus, PaymentType } from '../types';

function tone(status: PaymentStatus) {
  if (status === 'PAID') return 'success';
  if (status === 'OVERDUE') return 'danger';
  return 'warning';
}

const labels: Record<PaymentStatus, string> = {
  PENDING: 'Ожидает оплаты',
  PAID: 'Оплачено',
  OVERDUE: 'Просрочено',
};

const typeLabels: Record<PaymentType, string> = {
  WATER: 'Вода',
  HEATING: 'Отопление',
  OTHER: 'Другое',
};

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<Payment[]>('/admin/payments')
      .then(setPayments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить оплаты'));
  }, []);

  async function handleExport() {
    await exportToExcel('payments_export', 'Payments', payments.map((item) => ({
      Пользователь: item.user?.phone || '',
      Адрес: item.user?.fullAddress || '',
      'Лицевой счёт': item.user?.contractNumber || '',
      Месяц: item.billingMonth,
      Тип: item.type ? typeLabels[item.type] : '',
      Провайдер: item.provider || '',
      Потребление: item.consumption,
      Сумма: item.amount,
      Срок: new Date(item.dueDate).toLocaleDateString('ru-RU'),
      Статус: labels[item.status],
      Оплачено_в: item.paidAt ? new Date(item.paidAt).toLocaleString('ru-RU') : '',
    })));
  }

  return (
    <div className="stack">
      <PageHeader title="Оплаты" subtitle="Все начисления, статусы и сроки оплаты по пользователям." actions={<div className="inline-actions"><button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))}>Экспорт в Excel</button></div>} />
      <Notice type="error" text={error} />
      {!payments.length ? (
        <EmptyState title="Начислений пока нет" subtitle="После генерации платежей они появятся здесь." />
      ) : (
        <div className="card">
          <div className="table-toolbar">
            <p>Всего начислений: {payments.length}</p>
            <button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))}>Скачать Excel</button>
          </div>
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Адрес</th>
                <th>Месяц</th>
                <th>Тип</th>
                <th>Потребление</th>
                <th>Сумма</th>
                <th>Срок</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((item) => (
                <tr key={item.id}>
                  <td>{item.user?.phone || '—'}</td>
                  <td>{item.user?.fullAddress || '—'}</td>
                  <td>{item.billingMonth}</td>
                  <td>{item.type ? typeLabels[item.type] : '—'}</td>
                  <td>{item.consumption}</td>
                  <td>{item.amount} ₽</td>
                  <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                  <td>
                    <div className="stack" style={{ gap: 8 }}>
                      <StatusBadge tone={tone(item.status)}>{labels[item.status]}</StatusBadge>
                      {item.provider ? <span className="muted">Провайдер: {item.provider}</span> : null}
                      {item.paidAt ? <span className="muted">Оплачено: {new Date(item.paidAt).toLocaleString()}</span> : null}
                    </div>
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
