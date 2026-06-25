import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Trash2, Eye, Search, X, CircleCheck, Lock, CircleOff } from 'lucide-react';
import { formatMoney } from '../utils/format';

interface Raffle {
  id: string; title: string; status: string; ticketPrice: number;
  maxTickets: number | null; createdAt: string;
  tickets: { status: string }[];
  winner: { participant: { name: string }; ticket: { ticketNumber: number } } | null;
  createdBy: { name: string };
}

const statusIcon: Record<string, React.ReactNode> = {
  ACTIVE: <CircleCheck size={16} className="text-green-500" />,
  COMPLETED: <Lock size={16} className="text-blue-500" />,
  CANCELLED: <CircleOff size={16} className="text-red-500" />,
};

const statusLabel: Record<string, string> = {
  ACTIVE: 'Abierto',
  COMPLETED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

export default function RafflesListPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [yapePhone, setYapePhone] = useState('');
  const [maxTickets, setMaxTickets] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadRaffles = async () => {
    const res = await api.get('/raffles');
    setRaffles(res.data);
  };

  useEffect(() => { loadRaffles(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/raffles', { title, ticketPrice: Number(ticketPrice), yapePhone: yapePhone || null, maxTickets: maxTickets ? Number(maxTickets) : undefined, description: description || undefined });
    setShowCreate(false); setTitle(''); setTicketPrice(''); setYapePhone(''); setMaxTickets(''); setDescription('');
    loadRaffles();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/raffles/${deleteId}`);
    setDeleteId(null);
    loadRaffles();
  };

  const filtered = raffles.filter((r) =>
    (!search || r.title.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || r.status === filterStatus)
  );

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sorteos</h1>
        <button onClick={() => setShowCreate(true)} title="Nuevo sorteo"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> Nuevo Sorteo
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Crear Sorteo</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Precio del ticket (S/)</label>
                <input type="number" step="0.01" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">N° Yape (opcional)</label>
                <input value={yapePhone} onChange={(e) => setYapePhone(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="51987123456" />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Máx. tickets (opcional)</label>
                <input type="number" value={maxTickets} onChange={(e) => setMaxTickets(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descripción (opcional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1"><X size={14} /> Cancelar</button>
                <button type="submit" title="Crear sorteo"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"><Plus size={14} /> Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-wrap gap-2 items-center">
          <div className="relative max-w-xs flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar sorteo..."
              className="w-full border rounded pl-9 pr-8 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            {search && (
              <button onClick={() => setSearch('')} title="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">Todos</option>
            <option value="ACTIVE">Abierto</option>
            <option value="COMPLETED">Cerrado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Título</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Estado</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Precio</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Tickets</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Ganador</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Creado</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Creado por</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id}
                className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}>
                <td className="px-4 py-3 font-medium dark:text-white">{r.title}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {statusIcon[r.status] || null}
                    <span className="text-xs">{statusLabel[r.status] || r.status}</span>
                  </div>
                </td>
                <td className="px-4 py-3 dark:text-gray-300">{formatMoney(r.ticketPrice)}</td>
                <td className="px-4 py-3 dark:text-gray-300">{r.tickets.length}/{r.maxTickets || '∞'}</td>
                <td className="px-4 py-3 dark:text-gray-300">{r.winner ? `${r.winner.participant.name} (#${r.winner.ticket.ticketNumber})` : '-'}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                  {new Date(r.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.createdBy.name}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    <Link to={`/dashboard/raffles/${r.id}`} title="Ver detalles"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1 text-xs font-medium">
                      <Eye size={14} /> Ver
                    </Link>
                    <button onClick={() => setDeleteId(r.id)} title="Eliminar sorteo"
                      className="text-red-400 hover:text-red-600 dark:text-red-400 flex items-center gap-1 text-xs font-medium">
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No hay sorteos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Eliminar sorteo"
        message="¿Eliminar este sorteo y todos sus tickets? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </DashboardLayout>
  );
}