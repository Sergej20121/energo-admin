import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { RequestsPage } from './pages/RequestsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { MetersPage } from './pages/MetersPage';
import { ReadingsPage } from './pages/ReadingsPage';
import { HeatingChargesPage } from './pages/HeatingChargesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ChangeRequestsPage } from './pages/ChangeRequestsPage';
import { AuditPage } from './pages/AuditPage';
import { ContractsPage } from './pages/ContractsPage';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="meters" element={<MetersPage />} />
            <Route path="readings" element={<ReadingsPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="change-requests" element={<ChangeRequestsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="heating-charges" element={<HeatingChargesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="audit" element={<AuditPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);