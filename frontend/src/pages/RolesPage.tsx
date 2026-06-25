import { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import ConfirmModal from '../components/ConfirmModal';
import { Shield, Plus, Trash2, Pencil, X, Check, List } from 'lucide-react';
import FloatingInput from '../components/FloatingInput';

interface Permission {
  id: string; name: string;
}

interface Role {
  id: string; name: string; description: string | null;
  permissions: { permission: Permission }[];
  _count: { users: number };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [showCreatePerm, setShowCreatePerm] = useState(false);
  const [newPermName, setNewPermName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [error, setError] = useState('');

  const loadRoles = async () => {
    const res = await api.get('/roles');
    setRoles(res.data);
  };
  const loadPermissions = async () => {
    const res = await api.get('/roles/permissions');
    setPermissions(res.data);
  };

  useEffect(() => { loadRoles(); loadPermissions(); }, []);

  const resetRoleForm = () => {
    setRoleName(''); setRoleDesc(''); setSelectedPerms([]); setError('');
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/roles', { name: roleName, description: roleDesc || undefined, permissionIds: selectedPerms });
      setShowCreateRole(false); resetRoleForm(); loadRoles();
    } catch (err: any) { setError(err.response?.data?.error || 'Error al crear'); }
  };

  const handleEditClick = (r: Role) => {
    setEditRole(r);
    setRoleName(r.name);
    setRoleDesc(r.description || '');
    setSelectedPerms(r.permissions.map((p) => p.permission.id));
    setError('');
    setShowEditRole(true);
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!editRole) return;
    try {
      await api.patch(`/roles/${editRole.id}`, { name: roleName, description: roleDesc || undefined, permissionIds: selectedPerms });
      setShowEditRole(false); setEditRole(null); resetRoleForm(); loadRoles();
    } catch (err: any) { setError(err.response?.data?.error || 'Error al actualizar'); }
  };

  const handleDeleteClick = (r: Role) => {
    setDeleteId(r.id);
    setDeleteName(r.name);
  };

  const handleDeleteRole = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/roles/${deleteId}`);
      setDeleteId(null); loadRoles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar');
      setDeleteId(null);
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/roles/permissions', { name: newPermName });
      setShowCreatePerm(false); setNewPermName(''); loadPermissions();
    } catch (err: any) { alert(err.response?.data?.error || 'Error al crear permiso'); }
  };

  const handleDeletePermission = async (id: string) => {
    try {
      await api.delete(`/roles/permissions/${id}`);
      loadPermissions(); loadRoles();
    } catch { alert('Error al eliminar permiso'); }
  };

  const togglePerm = (id: string) => {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Roles y Permisos</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreatePerm(true); setNewPermName(''); }}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
            <List size={16} /> Nuevo Permiso
          </button>
          <button onClick={() => { setShowCreateRole(true); resetRoleForm(); }}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
            <Plus size={16} /> Nuevo Rol
          </button>
        </div>
      </div>

      {showCreatePerm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm relative">
            <button onClick={() => setShowCreatePerm(false)} title="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Nuevo Permiso</h2>
            <form onSubmit={handleCreatePermission}>
              <FloatingInput label="Nombre del permiso" value={newPermName} onChange={setNewPermName} placeholder="ej: raffle.delete" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreatePerm(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"><Plus size={14} /> Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg overflow-y-auto max-h-[90vh] relative">
            <button onClick={() => setShowCreateRole(false)} title="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Nuevo Rol</h2>
            <form onSubmit={handleCreateRole}>
              <FloatingInput label="Nombre del rol" value={roleName} onChange={setRoleName} required />
              <FloatingInput label="Descripción" value={roleDesc} onChange={setRoleDesc} />
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Permisos</label>
                <div className="border dark:border-gray-600 rounded max-h-48 overflow-y-auto p-2 space-y-1">
                  {permissions.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer dark:text-gray-300">
                      <input type="checkbox" checked={selectedPerms.includes(p.id)}
                        onChange={() => togglePerm(p.id)}
                        className="rounded dark:bg-gray-700" />
                      {p.name}
                    </label>
                  ))}
                  {permissions.length === 0 && <p className="text-xs text-gray-400">Crea permisos primero</p>}
                </div>
              </div>
              {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreateRole(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"><Plus size={14} /> Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditRole && editRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg overflow-y-auto max-h-[90vh] relative">
            <button onClick={() => { setShowEditRole(false); setEditRole(null); }} title="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Editar Rol</h2>
            <form onSubmit={handleEditRole}>
              <FloatingInput label="Nombre del rol" value={roleName} onChange={setRoleName} required />
              <FloatingInput label="Descripción" value={roleDesc} onChange={setRoleDesc} />
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Permisos</label>
                <div className="border dark:border-gray-600 rounded max-h-48 overflow-y-auto p-2 space-y-1">
                  {permissions.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer dark:text-gray-300">
                      <input type="checkbox" checked={selectedPerms.includes(p.id)}
                        onChange={() => togglePerm(p.id)}
                        className="rounded dark:bg-gray-700" />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowEditRole(false); setEditRole(null); }}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"><Check size={14} /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Rol</th>
                <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Descripción</th>
                <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Usuarios</th>
                <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r, i) => (
                <tr key={r.id}
                  className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}>
                  <td className="px-4 py-3 font-medium dark:text-white flex items-center gap-2">
                    <Shield size={16} className="text-blue-500" />
                    {r.name}
                  </td>
                  <td className="px-4 py-3 dark:text-gray-400 text-xs">{r.description || '-'}</td>
                  <td className="px-4 py-3 dark:text-gray-300">{r._count.users}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 items-center">
                      <button onClick={() => handleEditClick(r)} title="Editar"
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 text-xs font-medium">
                        <Pencil size={14} /> Editar
                      </button>
                      {r.name !== 'SUPERADMIN' && (
                        <button onClick={() => handleDeleteClick(r)} title="Eliminar"
                          className="text-red-400 hover:text-red-600 dark:text-red-400 flex items-center gap-1 text-xs font-medium">
                          <Trash2 size={14} /> Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="font-semibold text-sm dark:text-gray-200">Permisos</h3>
          </div>
          <ul className="divide-y dark:divide-gray-700">
            {permissions.map((p) => (
              <li key={p.id} className="px-4 py-2.5 flex justify-between items-center text-sm dark:text-gray-300 group">
                <span>{p.name}</span>
                <button onClick={() => handleDeletePermission(p.id)} title="Eliminar permiso"
                  className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
            {permissions.length === 0 && (
              <li className="px-4 py-4 text-sm text-gray-400 text-center">Sin permisos</li>
            )}
          </ul>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Eliminar rol"
        message={`¿Eliminar el rol "${deleteName}"?`}
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDeleteRole}
        onCancel={() => setDeleteId(null)}
      />
    </DashboardLayout>
  );
}