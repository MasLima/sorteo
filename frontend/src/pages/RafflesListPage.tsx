import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';

interface Raffle {
  id: string;
  title: string;
  status: string;
  ticketPrice: number;
  maxTickets: number | null;
  createdAt: string;
  tickets: { status: string }[];
  winner: { participant: { name: string }; ticket: { ticketNumber: number } } | null;
  createdBy: { name: string };
}

export default function RafflesListPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [yapePhone, setYapePhone] = useState('');
  const [maxTickets, setMaxTickets] = useState('');
  const [description, setDescription] = useState('');

  const loadRaffles = async () => {
    const res = await api.get('/raffles');
    setRaffles(res.data);
  };

  useEffect(() => { loadRaffles(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/raffles', {
      title,
      ticketPrice: Number(ticketPrice),
      yapePhone: yapePhone || null,
      maxTickets: maxTickets ? Number(maxTickets) : undefined,
      description: description || undefined,
    });
    setShowCreate(false);
    setTitle('');
    setTicketPrice('');
    setYapePhone('');
    setMaxTickets('');
    setDescription('');
    loadRaffles();
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return `px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`;
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sorteos</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          + Nuevo Sorteo
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Crear Sorteo</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Precio del ticket</label>
                <input type="number" step="0.01" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">N° Yape (opcional)</label>
                <input value={yapePhone} onChange={(e) => setYapePhone(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="51987123456" />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Máx. tickets (opcional)</label>
                <input type="number" value={maxTickets} onChange={(e) => setMaxTickets(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
                <button type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Título</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              <th className="text-left px-4 py-3 font-medium">Precio</th>
              <th className="text-left px-4 py-3 font-medium">Tickets</th>
              <th className="text-left px-4 py-3 font-medium">Ganador</th>
              <th className="text-left px-4 py-3 font-medium">Creado por</th>
              <th className="text-left px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {raffles.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.title}</td>
                <td className="px-4 py-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                <td className="px-4 py-3">${r.ticketPrice}</td>
                <td className="px-4 py-3">
                  {r.tickets.filter((t) => t.status === 'CONFIRMED').length}/{r.maxTickets || '∞'}
                </td>
                <td className="px-4 py-3">
                  {r.winner ? `${r.winner.participant.name} (#${r.winner.ticket.ticketNumber})` : '-'}
                </td>
                <td className="px-4 py-3 text-gray-500">{r.createdBy.name}</td>
                <td className="px-4 py-3">
                  <Link to={`/dashboard/raffles/${r.id}`}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium">Ver detalles</Link>
                </td>
              </tr>
            ))}
            {raffles.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay sorteos creados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
