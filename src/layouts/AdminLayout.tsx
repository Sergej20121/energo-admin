import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type NavGroup = {
  title: string;
  items: Array<{ to: string; label: string }>;
};

const navGroups: NavGroup[] = [
  {
    title: 'Обзор',
    items: [
      { to: '/', label: 'Дашборд' },
      { to: '/profile', label: 'Профиль' },
    ],
  },
  {
    title: 'Абоненты и счётчики',
    items: [
      { to: '/users', label: 'Пользователи' },
      { to: '/contracts', label: 'Реестр договоров' },
      { to: '/meters', label: 'Счётчики' },
      { to: '/readings', label: 'Показания' },
    ],
  },
  {
    title: 'Начисления и сервис',
    items: [
      { to: '/payments', label: 'Оплаты' },
      { to: '/heating-charges', label: 'Отопление' },
      { to: '/requests', label: 'Заявки' },
      { to: '/change-requests', label: 'Изменение данных' },
    ],
  },
  {
    title: 'Безопасность',
    items: [
      { to: '/audit', label: 'Аудит действий' },
    ],
  },
  {
    title: 'Коммуникации',
    items: [
      { to: '/notifications', label: 'Уведомления' },
      { to: '/announcements', label: 'Объявления' },
    ],
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Обзор': true,
    'Абоненты и счётчики': true,
    'Начисления и сервис': true,
    'Коммуникации': true,
    'Безопасность': true,
  });

  const summary = useMemo(
    () => [
      { label: 'Режим', value: 'Локальный запуск' },
      { label: 'Админ', value: user?.phone || '—' },
    ],
    [user?.phone],
  );

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-kicker">Heating Control</div>
          <div className="brand">Веб-админка</div>
          <div className="brand-text">Управление абонентами, договорами, начислениями и аудитом действий.</div>
        </div>

        <div className="sidebar-summary">
          {summary.map((item) => (
            <div key={item.label} className="sidebar-summary-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <nav className="nav-groups">
          {navGroups.map((group) => (
            <div key={group.title} className="nav-group">
              <button
                type="button"
                className="nav-group-toggle"
                onClick={() => setOpenGroups((current) => ({ ...current, [group.title]: !current[group.title] }))}
              >
                <span>{group.title}</span>
                <span>{openGroups[group.title] ? '−' : '+'}</span>
              </button>

              {openGroups[group.title] ? (
                <div className="nav-group-items">
                  {group.items.map((link) => (
                    <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div>
            <div className="topbar-title">Панель администратора</div>
            <div className="topbar-subtitle">{user?.phone}</div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-chip">Excel-экспорт включён</div>
            <button
              className="button secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Выйти
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
