import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import ConfirmModal from '../components/ConfirmModal';
import { UserPlus, Shield, Ban, Trash2, Pencil, X, Plus, Check } from 'lucide-react';
import FloatingInput from '../components/FloatingInput';

interface User {
  id: string; name: string; email: string; phone: string | null;
  isActive: boolean; createdAt: string;
  role: { id: string; name: string };
}

interface Role {
  id: string; name: string; description: string | null;
  permissions: { permission: { id: string; name: string } }[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const loadUsers = async () => {
    const res = await api.get('/users');
    setUsers(res.data);
  };
  const loadRoles = async () => {
    const res = await api.get('/users/roles');
    setRoles(res.data);
  };

  useEffect(() => { loadUsers(); loadRoles(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/users', { name, email, password, phone: phone || undefined, roleId });
      setShowCreate(false); setName(''); setEmail(''); setPassword(''); setPhone(''); setRoleId('');
      loadUsers();
    } catch (err: any) { setError(err.response?.data?.error || 'Error al crear'); }
  };

  const handleEditClick = (u: User) => {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone || '');
    setRoleId(u.role.id);
    setError('');
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!editUser) return;
    try {
      await api.patch(`/users/${editUser.id}`, { name, email, phone: phone || undefined, roleId });
      setShowEdit(false); setEditUser(null); setName(''); setEmail(''); setPhone(''); setRoleId('');
      loadUsers();
    } catch (err: any) { setError(err.response?.data?.error || 'Error al actualizar'); }
  };

  const handleDeactivate = async (id: string) => {
    await api.delete(`/users/${id}`);
    loadUsers();
  };

  const handleDeleteClick = (u: User) => {
    setDeleteId(u.id);
    setDeleteName(u.name);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      setDeleteId(null);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar');
      setDeleteId(null);
    }
  };

  const isSuperAdmin = (u: User) => u.role.name === 'SUPERADMIN';

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Usuarios</h1>
        <button onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
          <UserPlus size={16} /> Nuevo Usuario
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setShowCreate(false)} title="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Crear Usuario</h2>
            <form onSubmit={handleCreate}>
              <FloatingInput label="Nombre" value={name} onChange={setName} required />
              <FloatingInput label="Email" value={email} onChange={setEmail} type="email" required />
              <FloatingInput label="Contraseña" value={password} onChange={setPassword} type="password" required />
              <FloatingInput label="Teléfono" value={phone} onChange={setPhone} />
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Rol</label>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                  <option value="">Seleccionar...</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"><Plus size={14} /> Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => { setShowEdit(false); setEditUser(null); }} title="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Editar Usuario</h2>
            <form onSubmit={handleEdit}>
              <FloatingInput label="Nombre" value={name} onChange={setName} required />
              <FloatingInput label="Email" value={email} onChange={setEmail} type="email" required />
              <FloatingInput label="Teléfono" value={phone} onChange={setPhone} />
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Rol</label>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                  <option value="">Seleccionar...</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowEdit(false); setEditUser(null); }}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"><Check size={14} /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Nombre</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Email</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Rol</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Estado</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id}
                className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}>
                <td className="px-4 py-3 font-medium dark:text-white">{u.name}</td>
                <td className="px-4 py-3 dark:text-gray-300">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Shield size={14} className="text-blue-500" />
                    {u.role.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 items-center">
                    {!isSuperAdmin(u) && (
                      <>
                        <button onClick={() => handleEditClick(u)} title="Editar"
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 text-xs font-medium">
                          <Pencil size={14} /> Editar
                        </button>
                        {u.isActive ? (
                          <button onClick={() => handleDeactivate(u.id)} title="Desactivar"
                            className="text-orange-500 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 text-xs font-medium">
                            <Ban size={14} /> Desactivar
                          </button>
                        ) : null}
                        <button onClick={() => handleDeleteClick(u)} title="Eliminar"
                          className="text-red-400 hover:text-red-600 dark:text-red-400 flex items-center gap-1 text-xs font-medium">
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </>
                    )}
                    {isSuperAdmin(u) && (
                      <span className="text-xs text-gray-400 italic">No editable</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Eliminar usuario"
        message={`¿Eliminar permanentemente a "${deleteName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </DashboardLayout>
  );
}