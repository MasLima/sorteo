import { useState } from 'react';
import api from '../services/api';
import FloatingInput from './FloatingInput';
import { X, Lock } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} title="Cerrar"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={18} />
        </button>
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          <Lock size={18} /> Cambiar Contraseña
        </h2>
        {success ? (
          <div>
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded mb-4 text-sm">
              Contraseña cambiada exitosamente
            </div>
            <button onClick={onClose}
              className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FloatingInput label="Contraseña actual" value={currentPassword} onChange={setCurrentPassword} type="password" required />
            <FloatingInput label="Nueva contraseña" value={newPassword} onChange={setNewPassword} type="password" required />
            <FloatingInput label="Confirmar nueva contraseña" value={confirmPassword} onChange={setConfirmPassword} type="password" required />
            {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                <Lock size={14} /> Cambiar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}