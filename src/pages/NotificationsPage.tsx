import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Notice, PageHeader } from '../components/Ui';
import type { User } from '../types';

export function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<'all' | 'user'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    apiRequest<User[]>('/admin/users')
      .then((data) => setUsers(data.filter((item) => item.role === 'USER')))
      .catch(() => undefined);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!title.trim() || !body.trim()) {
        throw new Error('Заполните заголовок и текст уведомления');
      }

      if (mode === 'user' && !userId.trim()) {
        throw new Error('Для персонального уведомления выберите пользователя');
      }

      const response = await apiRequest<{ message?: string; count?: number }>({
        all: '/admin/notifications/broadcast',
        user: '/admin/notifications/user',
      }[mode], {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          userId: mode === 'user' ? userId.trim() : undefined,
        }),
      });

      setSuccess(response?.message || (mode === 'all' ? 'Рассылка отправлена.' : 'Уведомление отправлено пользователю.'));
      setTitle('');
      setBody('');
      if (mode === 'user') setUserId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить уведомление');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Уведомления"
        subtitle="Массовая рассылка или адресные уведомления. Для персональной отправки теперь можно выбрать пользователя из списка, а не вставлять ID вручную."
      />

      <Notice type="error" text={error} />
      <Notice type="success" text={success} />

      <div className="card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="segmented-control">
            <button type="button" className={`segmented-item ${mode === 'all' ? 'active' : ''}`} onClick={() => setMode('all')}>
              Всем активным
            </button>
            <button type="button" className={`segmented-item ${mode === 'user' ? 'active' : ''}`} onClick={() => setMode('user')}>
              Конкретному пользователю
            </button>
          </div>

          {mode === 'user' ? (
            <div className="field">
              <label>Пользователь</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Выберите пользователя</option>
                {users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.phone} — {item.contractNumber || 'Без договора'}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="field">
            <label>Заголовок</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, Обновление по начислениям" />
          </div>

          <div className="field">
            <label>Текст уведомления</label>
            <textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Введите понятное сообщение для пользователей" />
          </div>

          <div className="actions-row">
            <button className="button primary" type="submit" disabled={loading}>
              {loading ? 'Отправляем...' : mode === 'all' ? 'Отправить рассылку' : 'Отправить уведомление'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
