import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { EmptyState, Notice, PageHeader, StatusBadge } from '../components/Ui';
import { exportToExcel } from '../utils/exportExcel';
import type { User, UserStatus } from '../types';

function userStatusTone(status: UserStatus) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'BLOCKED') return 'danger';
  return 'warning';
}

function userStatusText(status: UserStatus) {
  if (status === 'ACTIVE') return 'Активен';
  if (status === 'BLOCKED') return 'Заблокирован';
  return 'Ожидает активации';
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState('');
  const [creating, setCreating] = useState(false);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [heatedArea, setHeatedArea] = useState('');
  const [areaDrafts, setAreaDrafts] = useState<Record<string, string>>({});

  async function loadUsers() {
    const data = await apiRequest<User[]>('/admin/users');
    setUsers(data);
    setAreaDrafts(Object.fromEntries(data.map((user) => [user.id, String(user.heatedArea ?? 0)])));
  }

  useEffect(() => {
    loadUsers().catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить пользователей'));
  }, []);

  async function handleCreateUser(event: FormEvent) {
    event.preventDefault();

    if (password.trim().length < 10) {
      setError('Пароль должен содержать не менее 10 символов.');
      return;
    }

    if (!/[A-Za-zА-Яа-я]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?`~]/.test(password)) {
      setError('Пароль должен содержать букву, цифру и специальный символ.');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setSuccess('');

      await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          password,
          fullAddress,
          contractNumber,
          heatedArea: Number(heatedArea) || 0,
        }),
      });

      setPhone('');
      setPassword('');
      setFullAddress('');
      setContractNumber('');
      setHeatedArea('');

      await loadUsers();
      setSuccess('Пользователь успешно создан.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания пользователя');
    } finally {
      setCreating(false);
    }
  }

  async function saveHeatedArea(userId: string) {
    try {
      setBusyId(userId);
      setError('');
      setSuccess('');

      await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          heatedArea: Number(areaDrafts[userId]) || 0,
        }),
      });

      await loadUsers();
      setSuccess('Отапливаемая площадь сохранена.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения площади');
    } finally {
      setBusyId('');
    }
  }

  async function changeStatus(id: string, action: 'activate' | 'block') {
    try {
      setBusyId(id);
      setError('');
      setSuccess('');

      await apiRequest(`/admin/users/${id}/${action}`, { method: 'PATCH' });
      await loadUsers();

      setSuccess(action === 'activate' ? 'Пользователь активирован.' : 'Пользователь заблокирован.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка изменения статуса');
    } finally {
      setBusyId('');
    }
  }

  async function handleExport() {
    await exportToExcel('users_export', 'Users', users.map((user) => ({
      Телефон: user.phone,
      Адрес: user.fullAddress || '',
      'Лицевой счёт': user.contractNumber || '',
      Отапливаемая_площадь_м2: user.heatedArea ?? 0,
      Роль: user.role === 'ADMIN' ? 'Администратор' : 'Пользователь',
      Статус: userStatusText(user.status),
      Счетчиков: user.meters?.length ?? 0,
      Последнее_начисление: user.payments?.[0] ? `${user.payments[0].amount} ₽ (${user.payments[0].billingMonth})` : '',
    })));
  }

  return (
    <div className="stack">
      <PageHeader title="Пользователи" subtitle="Создание, активация, блокировка и быстрый контроль по лицевого счётам и начислениям." actions={<div className="inline-actions"><button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))}>Экспорт в Excel</button></div>} />

      <Notice type="error" text={error} />
      <Notice type="success" text={success} />

      <div className="card">
        <div className="card-header">
          <h3>Создать пользователя</h3>
          <p className="muted">Добавление нового пользователя напрямую из админки.</p>
        </div>

        <form className="form-grid" onSubmit={handleCreateUser}>
          <div className="field">
            <label>Телефон</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+79990002233"
              required
            />
          </div>

          <div className="field">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 10 символов, буквы, цифры и спецсимвол"
              required
            />
          </div>

          <div className="field">
            <label>Адрес</label>
            <input
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="г. Москва, ул. Новая, д. 10"
              required
            />
          </div>

          <div className="field">
            <label>Номер лицевого счёта</label>
            <input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="USER-001"
              required
            />
          </div>

          <div className="field">
            <label>Отапливаемая площадь, м²</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={heatedArea}
              onChange={(e) => setHeatedArea(e.target.value)}
              placeholder="Например, 54.2"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button className="button primary" type="submit" disabled={creating}>
              {creating ? 'Создание...' : 'Создать пользователя'}
            </button>
          </div>
        </form>
      </div>

      {!users.length ? (
        <EmptyState title="Пользователей пока нет" subtitle="После регистрации или создания админом они появятся здесь." />
      ) : (
        <div className="card">
          <div className="table-toolbar">
            <p>Всего пользователей: {users.length}</p>
            <button className="button secondary" onClick={() => handleExport().catch((err) => setError(err instanceof Error ? err.message : 'Ошибка экспорта'))}>Скачать Excel</button>
          </div>
          <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Телефон</th>
                <th>Адрес</th>
                <th>Лицевой счёт</th>
                <th>Счётчики</th>
                <th>Площадь отопления</th>
                <th>Последнее начисление</th>
                <th>Роль / статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const lastPayment = user.payments?.[0];

                return (
                  <tr key={user.id}>
                    <td>{user.phone}</td>
                    <td>{user.fullAddress || '—'}</td>
                    <td>{user.contractNumber || '—'}</td>
                    <td>{user.meters?.length ?? 0}</td>
                    <td>
                      <div className="inline-actions" style={{ gap: 8 }}>
                        <input
                          style={{ width: 110 }}
                          type="number"
                          min="0"
                          step="0.01"
                          value={areaDrafts[user.id] ?? String(user.heatedArea ?? 0)}
                          onChange={(e) => setAreaDrafts((prev) => ({ ...prev, [user.id]: e.target.value }))}
                        />
                        <button
                          className="button secondary"
                          disabled={busyId === user.id}
                          onClick={() => saveHeatedArea(user.id)}
                        >
                          Сохранить
                        </button>
                      </div>
                    </td>
                    <td>{lastPayment ? `${lastPayment.amount} ₽ (${lastPayment.billingMonth})` : '—'}</td>
                    <td>
                      <div className="stack" style={{ gap: 8 }}>
                        <StatusBadge tone="neutral">
                          {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                        </StatusBadge>
                        <StatusBadge tone={userStatusTone(user.status)}>
                          {userStatusText(user.status)}
                        </StatusBadge>
                      </div>
                    </td>
                    <td>
                      {user.status === 'ACTIVE' ? (
                        <button
                          className="button danger"
                          disabled={busyId === user.id}
                          onClick={() => changeStatus(user.id, 'block')}
                        >
                          Заблокировать
                        </button>
                      ) : (
                        <button
                          className="button primary"
                          disabled={busyId === user.id}
                          onClick={() => changeStatus(user.id, 'activate')}
                        >
                          Активировать
                        </button>
                      )}
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