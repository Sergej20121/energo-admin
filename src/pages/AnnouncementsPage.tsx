import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { EmptyState, Notice, PageHeader, StatusBadge } from '../components/Ui';
import type { Announcement } from '../types';

export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  async function load() {
    const data = await apiRequest<Announcement[]>('/admin/announcements');
    setItems(data);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить объявления'));
  }, []);

  async function publishAnnouncement(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await apiRequest('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ title, body }),
      });
      await load();
      setTitle('');
      setBody('');
      setSuccess('Объявление опубликовано.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать объявление');
    } finally {
      setLoading(false);
    }
  }

  async function broadcast() {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await apiRequest('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, body }),
      });
      setTitle('');
      setBody('');
      setSuccess('Уведомление отправлено всем пользователям.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить рассылку');
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(id: string) {
    try {
      setDeletingId(id);
      setError('');
      setSuccess('');
      await apiRequest(`/admin/announcements/${id}`, { method: 'DELETE' });
      await load();
      setSuccess('Объявление снято с публикации.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось снять объявление с публикации');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <div className="stack">
      <PageHeader title="Объявления и уведомления" subtitle="Публикация новостей и массовые сообщения пользователям." />
      <Notice type="error" text={error} />
      <Notice type="success" text={success} />

      <form className="card form-grid" onSubmit={publishAnnouncement}>
        <div className="field">
          <label>Заголовок</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Введите заголовок" />
        </div>
        <div className="field">
          <label>Текст</label>
          <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Введите текст" />
        </div>
        <div className="actions-row">
          <button className="button primary" disabled={loading} type="submit">Опубликовать объявление</button>
          <button className="button secondary" disabled={loading || !title || !body} type="button" onClick={broadcast}>Разослать всем</button>
        </div>
      </form>

      <div className="card">
        <h2 className="section-title">История публикаций</h2>
        {!items.length ? (
          <EmptyState title="Объявлений пока нет" subtitle="После первой публикации они появятся здесь." />
        ) : (
          <div className="stack">
            {items.map((item) => (
              <div key={item.id} className="card" style={{ boxShadow: 'none', border: '1px solid #edf2f7' }}>
                <div className="page-header" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{item.title}</h3>
                    <p>{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <StatusBadge tone={item.isActive ? 'success' : 'warning'}>{item.isActive ? 'Активно' : 'Снято'}</StatusBadge>
                </div>
                <div style={{ marginBottom: 12 }}>{item.body}</div>
                {item.isActive ? <button className="button danger" disabled={deletingId === item.id} onClick={() => deactivate(item.id)}>Снять с публикации</button> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
