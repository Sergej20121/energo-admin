import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { EmptyState, Notice, PageHeader, StatusBadge } from '../components/Ui';
import { exportToExcel } from '../utils/exportExcel';
import type { Meter, MeterType, User } from '../types';

function meterTypeText(type: MeterType) {
  if (type === 'HEATING') return 'Отопление';
  if (type === 'HOT_WATER') return 'Горячая вода';
  return 'Холодная вода';
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU');
}

export function MetersPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingMeter, setCreatingMeter] = useState(false);
  const [creatingReading, setCreatingReading] = useState(false);
  const [busyId, setBusyId] = useState('');

  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState<MeterType>('HEATING');

  const [meterId, setMeterId] = useState('');
  const [readingValue, setReadingValue] = useState('');

  async function loadMeters() {
    const data = await apiRequest<Meter[]>('/admin/meters');
    setMeters(data);
  }

  async function loadUsers() {
    const data = await apiRequest<User[]>('/admin/users');
    setUsers(data.filter((user) => user.role === 'USER'));
  }

  useEffect(() => {
    Promise.all([loadMeters(), loadUsers()]).catch((err) =>
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные'),
    );
  }, []);

  async function handleCreateMeter(event: FormEvent) {
    event.preventDefault();

    try {
      setCreatingMeter(true);
      setError('');
      setSuccess('');

      await apiRequest('/admin/meters', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          title,
          serialNumber,
          type,
          isActive: true,
        }),
      });

      setUserId('');
      setTitle('');
      setSerialNumber('');
      setType('HEATING');

      await loadMeters();
      setSuccess('Счётчик успешно создан.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания счётчика');
    } finally {
      setCreatingMeter(false);
    }
  }

  async function handleCreateReading(event: FormEvent) {
    event.preventDefault();

    try {
      setCreatingReading(true);
      setError('');
      setSuccess('');

      await apiRequest('/admin/readings', {
        method: 'POST',
        body: JSON.stringify({
          meterId,
          value: Number(readingValue),
        }),
      });

      setMeterId('');
      setReadingValue('');

      await loadMeters();
      setSuccess('Показание успешно добавлено.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка добавления показания');
    } finally {
      setCreatingReading(false);
    }
  }

  async function changeMeterState(id: string, action: 'activate' | 'deactivate' | 'delete') {
    try {
      setBusyId(id);
      setError('');
      setSuccess('');

      await apiRequest(`/admin/meters/${id}/${action}`, {
        method: 'PATCH',
      });

      await loadMeters();

      if (action === 'activate') setSuccess('Счётчик активирован.');
      if (action === 'deactivate') setSuccess('Счётчик отключён.');
      if (action === 'delete') setSuccess('Счётчик удалён или деактивирован.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения счётчика');
    } finally {
      setBusyId('');
    }
  }

  async function handleExport() {
    await exportToExcel('meters_export', 'Meters', meters.map((meter) => ({
      Название: meter.title,
      Серийный_номер: meter.serialNumber,
      Тип: meterTypeText(meter.type),
      Пользователь: meter.user?.phone || '',
      Адрес: meter.user?.fullAddress || '',
      Договор: meter.user?.contractNumber || '',
      Статус: meter.isActive ? 'Активен' : 'Отключен',
      Последнее_показание: meter.readings?.[0]?.value ?? '',
      Дата_последнего: formatDate(meter.readings?.[0]?.createdAt),
    })));
  }

  return (
    <div className="stack">
      <PageHeader
        title="Счётчики"
        subtitle="Создание счётчиков, добавление показаний и управление статусом."
        actions={<div className="inline-actions"><button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))}>Экспорт в CSV</button></div>}
      />

      <Notice type="error" text={error} />
      <Notice type="success" text={success} />

      <div className="card">
        <div className="card-header">
          <h3>Добавить счётчик</h3>
          <p className="muted">Создание нового счётчика с привязкой к пользователю.</p>
        </div>

        <form className="form-grid" onSubmit={handleCreateMeter}>
          <div className="field">
            <label>Пользователь</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
              <option value="">Выберите пользователя</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.phone} — {user.contractNumber || 'Без договора'}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Название счётчика</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Счётчик отопления" required />
          </div>

          <div className="field">
            <label>Серийный номер</label>
            <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="HEAT-001" required />
          </div>

          <div className="field">
            <label>Тип</label>
            <select value={type} onChange={(e) => setType(e.target.value as MeterType)} required>
              <option value="HEATING">Отопление</option>
              <option value="HOT_WATER">Горячая вода</option>
              <option value="COLD_WATER">Холодная вода</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button className="button primary" type="submit" disabled={creatingMeter}>
              {creatingMeter ? 'Создание...' : 'Добавить счётчик'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Добавить показание</h3>
          <p className="muted">Ручное внесение показаний администратором.</p>
        </div>

        <form className="form-grid" onSubmit={handleCreateReading}>
          <div className="field">
            <label>Счётчик</label>
            <select value={meterId} onChange={(e) => setMeterId(e.target.value)} required>
              <option value="">Выберите счётчик</option>
              {meters.map((meter) => (
                <option key={meter.id} value={meter.id}>
                  {meter.title} — {meter.serialNumber} — {meter.user?.fullAddress || meter.user?.phone || 'Без адреса'}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Новое показание</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={readingValue}
              onChange={(e) => setReadingValue(e.target.value)}
              placeholder="Например 123.45"
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button className="button primary" type="submit" disabled={creatingReading}>
              {creatingReading ? 'Сохранение...' : 'Добавить показание'}
            </button>
          </div>
        </form>
      </div>

      {!meters.length ? (
        <EmptyState title="Счётчиков пока нет" subtitle="После создания они появятся здесь." />
      ) : (
        <div className="card">
          <div className="table-toolbar">
            <p>Всего счётчиков: {meters.length}</p>
            <button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))}>Скачать CSV</button>
          </div>
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Название</th>
                <th>Серийный номер</th>
                <th>Тип</th>
                <th>Пользователь</th>
                <th>Адрес</th>
                <th>Последнее показание</th>
                <th>Предыдущее</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {meters.map((meter) => {
                const lastReading = meter.readings?.[0];
                const previousReading = meter.readings?.[1];

                return (
                  <tr key={meter.id}>
                    <td>{meter.title}</td>
                    <td>{meter.serialNumber}</td>
                    <td>{meterTypeText(meter.type)}</td>
                    <td>{meter.user?.phone || '—'}</td>
                    <td>
                      <div>{meter.user?.fullAddress || '—'}</div>
                      <div className="muted">{meter.user?.contractNumber || '—'}</div>
                    </td>
                    <td>
                      {lastReading ? (
                        <div>
                          <div>{lastReading.value}</div>
                          <div className="muted">{formatDate(lastReading.createdAt)}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {previousReading ? (
                        <div>
                          <div>{previousReading.value}</div>
                          <div className="muted">{formatDate(previousReading.createdAt)}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <StatusBadge tone={meter.isActive ? 'success' : 'danger'}>
                        {meter.isActive ? 'Активный' : 'Отключён'}
                      </StatusBadge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {meter.isActive ? (
                          <button
                            className="button danger"
                            disabled={busyId === meter.id}
                            onClick={() => changeMeterState(meter.id, 'deactivate')}
                          >
                            Отключить
                          </button>
                        ) : (
                          <button
                            className="button primary"
                            disabled={busyId === meter.id}
                            onClick={() => changeMeterState(meter.id, 'activate')}
                          >
                            Включить
                          </button>
                        )}

                        <button
                          className="button secondary"
                          disabled={busyId === meter.id}
                          onClick={() => changeMeterState(meter.id, 'delete')}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}