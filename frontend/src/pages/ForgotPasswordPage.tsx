import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import FloatingInput from '../components/FloatingInput';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'Revisa tu email');
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Recuperar Contraseña</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Ingresa tu email para recibir instrucciones
        </p>
        {sent ? (
          <div>
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded mb-4 flex items-start gap-3">
              <CheckCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{message}</p>
                <p className="text-sm mt-1">Revisa tu bandeja de entrada (y la carpeta spam).</p>
              </div>
            </div>
            <Link to="/login"
              className="block text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FloatingInput label="Email" value={email} onChange={setEmail} type="email" required />
            {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2 mb-4">
              <Mail size={16} /> Enviar instrucciones
            </button>
            <Link to="/login"
              className="block text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Volver al login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}