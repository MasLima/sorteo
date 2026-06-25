import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import FloatingInput from '../components/FloatingInput';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800 dark:text-white">Sistema de Sorteo</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">Inicia sesión para continuar</p>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <FloatingInput label="Email" value={email} onChange={setEmail} type="email" required />
          </div>
          <div className="mb-2">
            <FloatingInput label="Contraseña" value={password} onChange={setPassword} type="password" required />
          </div>
          <div className="text-right mb-6">
            <Link to="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <button type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <LogIn size={18} /> Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}