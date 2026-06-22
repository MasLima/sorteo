import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RafflesListPage from './pages/RafflesListPage';
import RaffleDetailPage from './pages/RaffleDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<RafflesListPage />} />
      <Route path="/dashboard/raffles/:id" element={<RaffleDetailPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
