import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { EmptyState, Notice, PageHeader, StatusBadge } from '../components/Ui';
import { exportToExcel } from '../utils/exportExcel';
import type { AdminReading, MeterType } from '../types';

function meterTypeText(type: MeterType) {
  if (type === 'HEATING') return 'Отопление';
  if (type === 'HOT_WATER') return 'Горячая вода';
  return 'Холодная вода';
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU');
}

export function ReadingsPage() {
  const [readings, setReadings] = useState<AdminReading[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MeterType>('ALL');
  const [editingId, setEditingId] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [savingId, setSavingId] = useState('');

  async function loadReadings() {
    const data = await apiRequest<AdminReading[]>('/admin/readings');
    setReadings(data);
  }

  useEffect(() => {
    loadReadings().catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить показания'));
  }, []);

  const filteredReadings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return readings.filter((reading) => {
      const address = reading.meter.user?.fullAddress?.toLowerCase() || '';
      const phone = reading.meter.user?.phone?.toLowerCase() || '';
      const contract = reading.meter.user?.contractNumber?.toLowerCase() || '';

      const searchOk = !query || address.includes(query) || phone.includes(query) || contract.includes(query);
      const typeOk = typeFilter === 'ALL' || reading.meter.type === typeFilter;

      return searchOk && typeOk;
    });
  }, [readings, search, typeFilter]);

  function startEdit(reading: AdminReading) {
    setEditingId(reading.id);
    setEditingValue(String(reading.value));
    setError('');
    setSuccess('');
  }

  async function saveEdit(event: FormEvent, id: string) {
    event.preventDefault();

    try {
      setSavingId(id);
      setError('');
      setSuccess('');

      await apiRequest(`/admin/readings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          value: Number(editingValue),
        }),
      });

      setEditingId('');
      setEditingValue('');
      await loadReadings();
      setSuccess('Показание успешно обновлено.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка редактирования показания');
    } finally {
      setSavingId('');
    }
  }

  async function handleExport() {
    await exportToExcel('readings_export', 'Readings', filteredReadings.map((reading) => ({
      Дата: formatDate(reading.createdAt),
      Значение: reading.value,
      Счетчик: reading.meter.title,
      Серийный_номер: reading.meter.serialNumber,
      Тип: meterTypeText(reading.meter.type),
      Пользователь: reading.meter.user?.phone || '',
      Адрес: reading.meter.user?.fullAddress || '',
      'Лицевой счёт': reading.meter.user?.contractNumber || '',
    })));
  }

  return (
    <div className="stack">
      <PageHeader
        title="Показания"
        subtitle="Общая история всех переданных показаний по всем счётчикам."
        actions={<div className="inline-actions"><button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))}>Экспорт в Excel</button></div>}
      />

      <Notice type="error" text={error} />
      <Notice type="success" text={success} />

      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>Поиск по адресу, телефону или лицевому счёту</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Например: Ленина 10, +7999..., USER-001"
            />
          </div>

          <div className="field">
            <label>Тип счётчика</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'ALL' | MeterType)}>
              <option value="ALL">Все типы</option>
              <option value="HEATING">Отопление</option>
              <option value="HOT_WATER">Горячая вода</option>
              <option value="COLD_WATER">Холодная вода</option>
            </select>
          </div>
        </div>
      </div>

      {!filteredReadings.length ? (
        <EmptyState
          title="Показания не найдены"
          subtitle={search || typeFilter !== 'ALL' ? 'По заданным фильтрам ничего не найдено.' : 'Когда пользователи передадут показания, они появятся здесь.'}
        />
      ) : (
        <div className="card">
          <div className="table-toolbar">
            <p>Записей по фильтру: {filteredReadings.length}</p>
            <button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))}>Скачать Excel</button>
          </div>
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Значение</th>
                <th>Счётчик</th>
                <th>Тип</th>
                <th>Пользователь</th>
                <th>Адрес</th>
                <th>Лицевой счёт</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredReadings.map((reading) => (
                <tr key={reading.id}>
                  <td>{formatDate(reading.createdAt)}</td>
                  <td>
                    {editingId === reading.id ? (
                      <form onSubmit={(e) => saveEdit(e, reading.id)}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          style={{ width: 120 }}
                        />
                      </form>
                    ) : (
                      <StatusBadge tone="neutral">{reading.value}</StatusBadge>
                    )}
                  </td>
                  <td>
                    <div>{reading.meter.title}</div>
                    <div className="muted">{reading.meter.serialNumber}</div>
                  </td>
                  <td>{meterTypeText(reading.meter.type)}</td>
                  <td>{reading.meter.user?.phone || '—'}</td>
                  <td>{reading.meter.user?.fullAddress || '—'}</td>
                  <td>{reading.meter.user?.contractNumber || '—'}</td>
                  <td>
                    {editingId === reading.id ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="button primary"
                          disabled={savingId === reading.id}
                          onClick={(e) => saveEdit(e, reading.id)}
                        >
                          Сохранить
                        </button>
                        <button
                          className="button secondary"
                          onClick={() => {
                            setEditingId('');
                            setEditingValue('');
                          }}
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button className="button secondary" onClick={() => startEdit(reading)}>
                        Редактировать
                      </button>
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