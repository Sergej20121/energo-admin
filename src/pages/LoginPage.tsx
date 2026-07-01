import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notice } from '../components/Ui';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [navigate, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(phone, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="centered-page">
      <form className="auth-card form-grid" onSubmit={onSubmit}>
        <div>
          <h1>Веб-админка</h1>
          <p>Вход для администратора системы отопления.</p>
        </div>
        <Notice type="info" text={`API: ${getApiBaseUrl()}`} />
        <Notice type="error" text={error} />
        <div className="field">
          <label>Телефон</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Например, +79990001122" />
        </div>
        <div className="field">
          <label>Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" />
        </div>
        <button className="button primary" disabled={loading} type="submit">
          {loading ? 'Входим...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
