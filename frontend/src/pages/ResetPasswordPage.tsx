import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import FloatingInput from '../components/FloatingInput';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <Lock size={22} /> Restablecer Contraseña
        </h1>
        {success ? (
          <div>
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded mb-4 flex items-start gap-3">
              <CheckCircle size={20} className="mt-0.5 shrink-0" />
              <p className="font-medium">Contraseña restablecida exitosamente</p>
            </div>
            <Link to="/login"
              className="block text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Ir al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FloatingInput label="Nueva contraseña" value={newPassword} onChange={setNewPassword} type="password" required />
            <FloatingInput label="Confirmar contraseña" value={confirmPassword} onChange={setConfirmPassword} type="password" required />
            {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2 mb-4">
              <Lock size={16} /> Restablecer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}