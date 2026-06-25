import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RafflesListPage from './pages/RafflesListPage';
import RaffleDetailPage from './pages/RaffleDetailPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import PayPage from './pages/PayPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<RafflesListPage />} />
      <Route path="/dashboard/raffles/:id" element={<RaffleDetailPage />} />
      <Route path="/dashboard/users" element={<UsersPage />} />
      <Route path="/dashboard/roles" element={<RolesPage />} />
      <Route path="/pay/:id" element={<PayPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
