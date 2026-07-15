import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Notice, PageHeader } from '../components/Ui';
import { useAuth } from '../context/AuthContext';
import type { CurrentUser } from '../types';

export function ProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<CurrentUser | null>(null);
  const [fullAddress, setFullAddress] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest<CurrentUser>('/users/me')
      .then((data) => {
        setProfile(data);
        setFullAddress(data.fullAddress || '');
        setContractNumber(data.contractNumber || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль'));
  }, []);

  async function saveProfile() {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const updated = await apiRequest<CurrentUser>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ fullAddress, contractNumber }),
      });
      setProfile(updated);
      await refreshUser();
      setSuccess('Профиль обновлён.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить профиль');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader title="Профиль администратора" subtitle="Данные авторизованного администратора и базовые настройки профиля." />
      <Notice type="error" text={error} />
      <Notice type="success" text={success} />
      <div className="grid two">
        <div className="card info-list">
          <div><strong>Телефон:</strong> {profile?.phone || '—'}</div>
          <div><strong>Роль:</strong> {profile?.role || '—'}</div>
          <div><strong>Статус:</strong> {profile?.status || '—'}</div>
          <div><strong>Создан:</strong> {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : '—'}</div>
        </div>
        <div className="card form-grid">
          <div className="field">
            <label>Адрес</label>
            <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} />
          </div>
          <div className="field">
            <label>Номер лицевого счёта</label>
            <input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} />
          </div>
          <button className="button primary" disabled={loading} onClick={saveProfile}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}
