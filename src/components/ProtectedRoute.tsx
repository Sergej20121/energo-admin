import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="centered-page"><div className="loader" /><p>Загрузка...</p></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
