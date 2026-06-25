import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Plus, CheckCircle, Clock, Send, X, Edit3, Trash2, Trophy,
  Search, Download, Wallet,
} from 'lucide-react';

interface Ticket {
  id: string; ticketNumber: number; status: string; paymentAmount: number;
  paymentProof: string | null; paymentNote: string | null;
  registrationSource: string | null; assignedAt: string; confirmedAt: string | null;
  participant: { id: string; name: string; phone: string };
  registeredBy: { name: string } | null;
}

interface Raffle {
  id: string; title: string; description: string | null; status: string;
  ticketPrice: number; yapePhone: string | null; maxTickets: number | null;
  startDate: string; endDate: string | null;
  tickets: Ticket[]; winner: { id: string; prize: string | null; announcedAt: string; participant: { name: string; phone: string }; ticket: { ticketNumber: number }; registeredBy: { name: string } } | null;
  createdBy: { id: string; name: string };
}

export default function RaffleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const qrYapeCanvas = useRef<HTMLCanvasElement>(null);
  const qrRegCanvas = useRef<HTMLCanvasElement>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(''); const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState(''); const [editYape, setEditYape] = useState(''); const [editMax, setEditMax] = useState('');

  const [showRegister, setShowRegister] = useState(false);
  const [pName, setPName] = useState(''); const [pPhone, setPPhone] = useState('');
  const [pEmail, setPEmail] = useState(''); const [pAmount, setPAmount] = useState('');

  const [showWinner, setShowWinner] = useState(false);
  const [ticketId, setTicketId] = useState(''); const [prize, setPrize] = useState('');

  const loadRaffle = async () => {
    try { const res = await api.get(`/raffles/${id}`); setRaffle(res.data); } catch { /* polling */ }
  };

  useEffect(() => { loadRaffle(); }, [id]);
  useEffect(() => { const i = setInterval(loadRaffle, 5000); return () => clearInterval(i); }, [id]);

  useEffect(() => {
    if (!raffle) return;
    if (qrYapeCanvas.current && raffle.yapePhone) {
      QRCode.toCanvas(qrYapeCanvas.current,
        `yape://v2/pay?phone=${raffle.yapePhone}&amount=${raffle.ticketPrice}&message=${encodeURIComponent(raffle.title)}`,
        { width: 160, margin: 2 }, (e) => { if (e) console.error(e); });
    }
    if (qrRegCanvas.current) {
      QRCode.toCanvas(qrRegCanvas.current, `${window.location.origin}/pay/${raffle.id}`,
        { width: 160, margin: 2 }, (e) => { if (e) console.error(e); });
    }
  }, [raffle]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      await api.patch(`/raffles/${id}`, { title: editTitle, description: editDesc || null, ticketPrice: Number(editPrice), yapePhone: editYape || null, maxTickets: editMax ? Number(editMax) : null });
      setSuccess('Sorteo actualizado'); setShowEdit(false); loadRaffle();
    } catch (err: any) { setError(err.response?.data?.error || 'Error al actualizar'); }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este sorteo y todos sus tickets?')) return;
    try { await api.delete(`/raffles/${id}`); navigate('/dashboard'); } catch (err: any) { setError(err.response?.data?.error || 'Error al eliminar'); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await api.post(`/raffles/${id}/tickets`, { participantName: pName, participantPhone: pPhone, participantEmail: pEmail || null, paymentAmount: Number(pAmount) });
      setSuccess(`Ticket registrado: #${res.data.ticketNumber} - ${res.data.participant.name}`);
      setShowRegister(false); setPName(''); setPPhone(''); setPEmail(''); setPAmount('');
      loadRaffle();
    } catch (err: any) { setError(err.response?.data?.error || 'Error al registrar'); }
  };

  const handleConfirm = async (tid: string) => {
    try { await api.patch(`/raffles/tickets/${tid}/confirm`, { status: 'CONFIRMED' }); setSuccess('Pago confirmado'); loadRaffle(); }
    catch (err: any) { setError(err.response?.data?.error || 'Error al confirmar'); }
  };

  const handleDeleteTicket = async (tid: string) => {
    if (!confirm('¿Eliminar este ticket?')) return;
    try { await api.delete(`/raffles/tickets/${tid}`); setSuccess('Ticket eliminado'); loadRaffle(); }
    catch (err: any) { setError(err.response?.data?.error || 'Error al eliminar'); }
  };

  const handleWinner = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    try { await api.post(`/raffles/${id}/winner`, { ticketId, prize: prize || null }); setSuccess('Ganador registrado'); setShowWinner(false); setTicketId(''); setPrize(''); loadRaffle(); }
    catch (err: any) { setError(err.response?.data?.error || 'Error al registrar ganador'); }
  };

  const sendNotif = async (endpoint: string, body: Record<string, string>) => {
    try { await api.post(`/notifications/${endpoint}`, body); setSuccess('Notificación enviada'); } catch (err: any) { setError(err.response?.data?.error || 'Error'); }
  };

  const exportExcel = () => {
    if (!raffle) return;
    const data = raffle.tickets.map((t) => ({
      '# Ticket': t.ticketNumber,
      Participante: t.participant.name,
      Teléfono: t.participant.phone,
      Monto: t.paymentAmount,
      Estado: t.status,
      Origen: t.registrationSource === 'PUBLIC' ? 'Web' : 'Manual',
      Registrado: t.registeredBy?.name || 'Auto-registro',
      Fecha: new Date(t.assignedAt).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    XLSX.writeFile(wb, `tickets-${raffle.title.replace(/\s+/g, '-')}.xlsx`);
  };

  if (!raffle) return <DashboardLayout><p className="text-gray-500 dark:text-gray-400">Cargando...</p></DashboardLayout>;

  const confirmedTickets = raffle.tickets.filter((t) => t.status === 'CONFIRMED').length;
  const pendingTickets = raffle.tickets.filter((t) => t.status === 'PENDING').length;
  const filteredTickets = raffle.tickets.filter((t) =>
    !search || t.participant.name.toLowerCase().includes(search.toLowerCase()) || t.participant.phone.includes(search));

  return (
    <DashboardLayout>
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 mb-4">
        <ArrowLeft size={16} /> Volver a sorteos
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{raffle.title}</h1>
            {raffle.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{raffle.description}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1"><Wallet size={14} /> S/.{raffle.ticketPrice}</span>
              {raffle.yapePhone && <span>Yape: <strong>{raffle.yapePhone}</strong></span>}
              <span>Vendidos: <strong>{confirmedTickets}/{raffle.maxTickets || '∞'}</strong></span>
              <span>Pendientes: <strong>{pendingTickets}</strong></span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${raffle.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : raffle.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>{raffle.status}</span>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            {raffle.status === 'ACTIVE' && (
              <>
                <button onClick={() => setShowRegister(true)} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-1"><Plus size={16} /> Registrar</button>
                {confirmedTickets > 0 && <button onClick={() => setShowWinner(true)} className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-1"><Trophy size={16} /> Ganador</button>}
              </>
            )}
            <button onClick={() => { setEditTitle(raffle.title); setEditDesc(raffle.description || ''); setEditPrice(String(raffle.ticketPrice)); setEditYape(raffle.yapePhone || ''); setEditMax(raffle.maxTickets ? String(raffle.maxTickets) : ''); setShowEdit(true); }}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1"><Edit3 size={16} /></button>
            <button onClick={handleDelete} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 p-1"><Trash2 size={16} /></button>
          </div>
        </div>

        {raffle.yapePhone && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Compartir con participantes:</p>
            <div className="flex flex-wrap items-start gap-8">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">QR para Yapear</p>
                <canvas ref={qrYapeCanvas} className="border rounded dark:border-gray-600 inline-block bg-white" />
                <p className="text-xs text-gray-400 mt-1">Escanea con Yape</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">QR para Registrarse</p>
                <canvas ref={qrRegCanvas} className="border rounded dark:border-gray-600 inline-block bg-white" />
                <p className="text-xs text-gray-400 mt-1">Escanea con cámara</p>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 pt-6">
                <p>Yapea al: <strong className="text-gray-800 dark:text-white">{raffle.yapePhone}</strong></p>
                <p>Monto: <strong className="text-gray-800 dark:text-white">S/.{raffle.ticketPrice}</strong></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm flex items-center gap-2"><X size={16} />{error}</div>}
      {success && <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded mb-4 text-sm flex items-center gap-2"><CheckCircle size={16} />{success}</div>}

      {raffle.winner && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-white"><Trophy size={20} className="text-yellow-500" /> Ganador</h3>
              <p className="mt-1 dark:text-gray-300">{raffle.winner.participant.name} - Ticket #{raffle.winner.ticket.ticketNumber}{raffle.winner.prize && ` - Premio: ${raffle.winner.prize}`}</p>
              <p className="text-xs text-gray-400 mt-1">Registrado por {raffle.winner.registeredBy.name}</p>
            </div>
            <button onClick={() => sendNotif('winner', { raffleId: raffle.id })}
              className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 flex items-center gap-1"><Send size={14} /> Notificar</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar participante..."
            className="flex-1 border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>}
          <button onClick={exportExcel} className="ml-auto bg-green-600 text-white px-3 py-2 rounded text-xs hover:bg-green-700 flex items-center gap-1"><Download size={14} /> Excel</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 dark:text-gray-300"># Ticket</th>
              <th className="text-left px-4 py-3 dark:text-gray-300">Participante</th>
              <th className="text-left px-4 py-3 dark:text-gray-300">Teléfono</th>
              <th className="text-left px-4 py-3 dark:text-gray-300">Monto</th>
              <th className="text-left px-4 py-3 dark:text-gray-300">Estado</th>
              <th className="text-left px-4 py-3 dark:text-gray-300">Origen</th>
              <th className="text-left px-4 py-3 dark:text-gray-300"></th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 font-medium dark:text-white">#{t.ticketNumber}</td>
                <td className="px-4 py-3 dark:text-gray-200">{t.participant.name}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.participant.phone}</td>
                <td className="px-4 py-3 dark:text-gray-300">S/.{t.paymentAmount}</td>
                <td className="px-4 py-3">
                  {t.status === 'CONFIRMED'
                    ? <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium"><CheckCircle size={14} /> Confirmado</span>
                    : <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-medium"><Clock size={14} /> Pendiente</span>
                  }
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                  {t.registrationSource === 'PUBLIC' ? 'Web' : 'Manual'}
                  <br /><span className="text-gray-400">{t.registeredBy?.name || 'Auto'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {t.status === 'PENDING' && raffle.status === 'ACTIVE' && (
                      <button onClick={() => handleConfirm(t.id)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 text-xs font-medium flex items-center gap-1"><CheckCircle size={13} /> Confirmar</button>
                    )}
                    {t.status === 'PENDING' && (
                      <button onClick={() => sendNotif('ticket', { ticketId: t.id })}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs flex items-center gap-1"><Send size={13} /></button>
                    )}
                    {t.status === 'CONFIRMED' && (
                      <button onClick={() => sendNotif('payment-confirmed', { ticketId: t.id })}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs flex items-center gap-1"><Send size={13} /></button>
                    )}
                    <button onClick={() => handleDeleteTicket(t.id)}
                      className="text-red-400 hover:text-red-600 dark:text-red-400 text-xs flex items-center"><X size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay tickets</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Editar Sorteo</h2>
            <form onSubmit={handleEdit}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Título</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descripción</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Precio</label>
                <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">N° Yape</label>
                <input value={editYape} onChange={(e) => setEditYape(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Máx. tickets</label>
                <input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Registrar Ticket</h2>
            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nombre del participante</label>
                <input value={pName} onChange={(e) => setPName(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Teléfono (WhatsApp)</label>
                <input value={pPhone} onChange={(e) => setPPhone(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required placeholder="51987123456" />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email (opcional)</label>
                <input type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Monto pagado</label>
                <input type="number" step="0.01" value={pAmount} onChange={(e) => setPAmount(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowRegister(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"><Plus size={14} /> Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWinner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2"><Trophy size={18} /> Registrar Ganador</h2>
            <form onSubmit={handleWinner}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Ticket ganador</label>
                <select value={ticketId} onChange={(e) => setTicketId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                  <option value="">Seleccionar ticket...</option>
                  {raffle.tickets.filter((t) => t.status === 'CONFIRMED').map((t) => (
                    <option key={t.id} value={t.id}>#{t.ticketNumber} - {t.participant.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Premio (opcional)</label>
                <input value={prize} onChange={(e) => setPrize(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowWinner(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"><Trophy size={14} /> Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}