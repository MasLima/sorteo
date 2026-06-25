import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import ConfirmModal from '../components/ConfirmModal';
import FloatingInput from '../components/FloatingInput';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { formatMoney } from '../utils/format';
import {
  ArrowLeft, Plus, CheckCircle, Clock, X, Edit3, Trash2, Trophy,
  Search, Download, ScanLine,
} from 'lucide-react';

function WhatsAppIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
  tickets: Ticket[];
  winner: { id: string; prize: string | null; announcedAt: string; participant: { name: string; phone: string }; ticket: { ticketNumber: number }; registeredBy: { name: string } } | null;
  createdBy: { id: string; name: string };
}

export default function RaffleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const qrYapeCanvas = useRef<HTMLCanvasElement>(null);
  const qrRegCanvas = useRef<HTMLCanvasElement>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  const [confirmDel, setConfirmDel] = useState<{ type: 'raffle' | 'ticket'; ticketId?: string } | null>(null);

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanCreate, setScanCreate] = useState(false);
  const [scanName, setScanName] = useState(''); const [scanPhone, setScanPhone] = useState(''); const [scanEmail, setScanEmail] = useState(''); const [scanAmount, setScanAmount] = useState(''); const [scanError, setScanError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRaffle = async () => {
    try { const res = await api.get(`/raffles/${id}`); setRaffle(res.data); } catch { /* polling */ }
  };

  const handleScanMatch = async (ticketId: string) => {
    try {
      const res = await api.post(`/raffles/${id}/scan-match`, {
        ticketId, amount: scanResult.amount, date: scanResult.date,
        time: scanResult.time, operationNumber: scanResult.operationNumber, rawText: scanResult.rawText,
      });
      setScanResult({ ...scanResult, ...res.data, autoConfirmed: true });
    } catch { setScanError('Error al asociar ticket'); }
  };

  const handleScanCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setScanError('');
    try {
      const res = await api.post(`/raffles/${id}/scan-create`, {
        participantName: scanName, participantPhone: scanPhone,
        participantEmail: scanEmail || null, amount: Number(scanAmount),
        date: scanResult.date, time: scanResult.time,
        operationNumber: scanResult.operationNumber, rawText: scanResult.rawText,
      });
      setScanResult({ ...scanResult, ...res.data, autoConfirmed: true });
      setScanCreate(false);
      loadRaffle();
    } catch (err: any) { setScanError(err.response?.data?.error || 'Error al crear'); }
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

  const handleDeleteTicket = async () => {
    if (!confirmDel?.ticketId) return;
    try { await api.delete(`/raffles/tickets/${confirmDel.ticketId}`); setSuccess('Ticket eliminado'); setConfirmDel(null); loadRaffle(); }
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

  const readonly = !!raffle.winner;
  const confirmedTickets = raffle.tickets.filter((t) => t.status === 'CONFIRMED').length;
  const pendingTickets = raffle.tickets.filter((t) => t.status === 'PENDING').length;
  const filteredByStatus = statusFilter === 'ALL' ? raffle.tickets : raffle.tickets.filter((t) => t.status === statusFilter);
  const filteredTickets = filteredByStatus.filter((t) =>
    !search || t.participant.name.toLowerCase().includes(search.toLowerCase()) || t.participant.phone.includes(search));

  return (
    <DashboardLayout>
      <button onClick={() => navigate('/dashboard')} title="Volver a sorteos"
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 mb-4">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{raffle.title}</h1>
            {raffle.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{raffle.description}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-gray-600 dark:text-gray-300">
               <span>Precio: <strong>{formatMoney(raffle.ticketPrice)}</strong></span>
              {raffle.yapePhone && <span>Yape: <strong>{raffle.yapePhone}</strong></span>}
              <span>Vendidos: <strong>{confirmedTickets}{raffle.maxTickets ? `/${raffle.maxTickets}` : ''}</strong></span>
              <span>Pendientes: <strong>{pendingTickets}</strong></span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${raffle.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : raffle.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>{raffle.status}</span>
            </div>
          </div>
          <div className="flex gap-1 items-start">
            {!readonly && raffle.status === 'ACTIVE' && (
              <>
                <button onClick={() => setShowRegister(true)} title="Registrar ticket"
                  className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-1"><Plus size={16} /> Registrar</button>
                <button onClick={() => fileInputRef.current?.click()} title="Escanear comprobante Yape"
                  className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 flex items-center gap-1" disabled={scanning}><ScanLine size={16} /> {scanning ? 'Escaneando...' : 'Scan'}</button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setScanning(true); setScanResult(null);
                  const form = new FormData(); form.append('image', file);
                  try { const res = await api.post(`/raffles/${id}/scan-payment`, form); setScanResult(res.data); } catch (err: any) { setScanResult({ matched: false, error: err.response?.data?.error || err.message || 'Error al procesar la imagen' }); }
                  setScanning(false);
                  e.target.value = '';
                }} />
                {confirmedTickets > 0 && <button onClick={() => setShowWinner(true)} title="Registrar ganador"
                  className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-1"><Trophy size={16} /> Ganador</button>}
              </>
            )}
            {!readonly && (
              <>
                <button onClick={() => { setEditTitle(raffle.title); setEditDesc(raffle.description || ''); setEditPrice(String(raffle.ticketPrice)); setEditYape(raffle.yapePhone || ''); setEditMax(raffle.maxTickets ? String(raffle.maxTickets) : ''); setShowEdit(true); }} title="Editar sorteo"
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1"><Edit3 size={16} /></button>
                <button onClick={() => setConfirmDel({ type: 'raffle' })} title="Eliminar sorteo"
                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 p-1"><Trash2 size={16} /></button>
              </>
            )}
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
                <p>Monto: <strong className="text-gray-800 dark:text-white">{formatMoney(raffle.ticketPrice)}</strong></p>
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
            <button onClick={() => sendNotif('winner', { raffleId: raffle.id })} title="Notificar por WhatsApp"
              className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 flex items-center gap-1"><WhatsAppIcon size={14} /> Notificar</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar participante..."
              className="w-full border rounded pl-9 pr-8 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            {search && (
              <button onClick={() => setSearch('')} title="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="CONFIRMED">Confirmados</option>
          </select>
          {statusFilter !== 'ALL' && (
            <button onClick={() => setStatusFilter('ALL')} title="Quitar filtro"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X size={14} />
            </button>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">{filteredTickets.length} de {raffle.tickets.length}</span>
          <button onClick={exportExcel} title="Exportar a Excel"
            className="ml-auto bg-green-600 text-white px-3 py-2 rounded text-xs hover:bg-green-700 flex items-center gap-1"><Download size={14} /> Excel</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold"># Ticket</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Participante</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Teléfono</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Monto</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Estado</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold">Origen</th>
              <th className="text-left px-4 py-3 dark:text-gray-200 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t, i) => (
              <tr key={t.id}
                className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}>
                <td className="px-4 py-3 font-medium dark:text-white">#{t.ticketNumber}</td>
                <td className="px-4 py-3 dark:text-gray-200">{t.participant.name}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.participant.phone}</td>
                <td className="px-4 py-3 dark:text-gray-300">{formatMoney(t.paymentAmount)}</td>
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
                  <div className="flex gap-3 items-center">
                    {!readonly && t.status === 'PENDING' && raffle.status === 'ACTIVE' && (
                      <button onClick={() => handleConfirm(t.id)} title="Confirmar pago"
                        className="text-green-600 hover:text-green-800 dark:text-green-400 text-xs font-medium flex items-center gap-1"><CheckCircle size={14} /></button>
                    )}
                    {!readonly && t.status === 'PENDING' && (
                      <button onClick={() => sendNotif('ticket', { ticketId: t.id })} title="Enviar WhatsApp"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs flex items-center"><WhatsAppIcon size={16} /></button>
                    )}
                    {t.status === 'CONFIRMED' && (
                      <button onClick={() => sendNotif('payment-confirmed', { ticketId: t.id })} title="Enviar WhatsApp"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs flex items-center"><WhatsAppIcon size={16} /></button>
                    )}
                    {!readonly && hasPermission('raffle.edit') && (
                      <button onClick={() => setConfirmDel({ type: 'ticket', ticketId: t.id })} title="Eliminar ticket"
                        className="text-red-400 hover:text-red-600 dark:text-red-400 text-xs flex items-center"><Trash2 size={14} /></button>
                    )}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setShowEdit(false)} title="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Editar Sorteo</h2>
            <form onSubmit={handleEdit}>
              <FloatingInput label="Título" value={editTitle} onChange={setEditTitle} required />
              <FloatingInput label="Descripción" value={editDesc} onChange={setEditDesc} rows={3} />
              <FloatingInput label="Precio" value={editPrice} onChange={setEditPrice} type="number" step="0.01" required />
              <FloatingInput label="N° Yape" value={editYape} onChange={setEditYape} />
              <FloatingInput label="Máx. tickets" value={editMax} onChange={setEditMax} type="number" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1">Cancelar</button>
                <button type="submit" title="Guardar cambios"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setShowRegister(false)} title="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Registrar Ticket</h2>
            <form onSubmit={handleRegister}>
              <FloatingInput label="Nombre del participante" value={pName} onChange={setPName} required />
              <FloatingInput label="Teléfono (WhatsApp)" value={pPhone} onChange={setPPhone} required placeholder="51987123456" />
              <FloatingInput label="Email (opcional)" value={pEmail} onChange={setPEmail} type="email" />
              <FloatingInput label="Monto pagado" value={pAmount} onChange={setPAmount} type="number" step="0.01" required />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowRegister(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1">Cancelar</button>
                <button type="submit" title="Registrar ticket"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"><Plus size={14} /> Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWinner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button onClick={() => setShowWinner(false)} title="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
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
                <FloatingInput label="Premio (opcional)" value={prize} onChange={setPrize} />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowWinner(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1">Cancelar</button>
                <button type="submit" title="Registrar ganador"
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"><Trophy size={14} /> Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setScanResult(null); setScanCreate(false); }} title="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <ScanLine size={18} /> Resultado del Escaneo
            </h2>

            {scanResult.autoConfirmed ? (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded mb-4 flex items-start gap-2">
                <CheckCircle size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Ticket #{scanResult.ticketNumber} confirmado</p>
                  <p className="text-sm">{scanResult.participant} — {formatMoney(scanResult.amount!)}</p>
                </div>
              </div>
            ) : scanCreate ? (
              <form onSubmit={handleScanCreate}>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Crea un nuevo ticket con los datos del comprobante</p>
                <FloatingInput label="Nombre del participante" value={scanName} onChange={setScanName} required />
                <FloatingInput label="Teléfono (WhatsApp)" value={scanPhone} onChange={setScanPhone} required placeholder="51987123456" />
                <FloatingInput label="Email (opcional)" value={scanEmail} onChange={setScanEmail} type="email" />
                <FloatingInput label="Monto" value={scanAmount} onChange={setScanAmount} type="number" step="0.01" required />
                {scanResult.operationNumber && (
                  <p className="text-xs text-gray-400 -mt-2 mb-3">Nro. Operación: {scanResult.operationNumber}</p>
                )}
                {scanError && <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded mb-4 text-sm">{scanError}</div>}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setScanCreate(false)}
                    className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"><Plus size={14} /> Crear Ticket</button>
                </div>
              </form>
            ) : (
              <div>
                {scanResult.error && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 p-3 rounded mb-4 text-sm">{scanResult.error}</div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  {scanResult.amount !== undefined && (
                    <div><span className="text-gray-400">Monto</span><p className="font-medium dark:text-white">{formatMoney(scanResult.amount)}</p></div>
                  )}
                  {scanResult.date && (
                    <div><span className="text-gray-400">Fecha</span><p className="font-medium dark:text-white">{scanResult.date}</p></div>
                  )}
                  {scanResult.time && (
                    <div><span className="text-gray-400">Hora</span><p className="font-medium dark:text-white">{scanResult.time}</p></div>
                  )}
                  {scanResult.operationNumber && (
                    <div className="col-span-2"><span className="text-gray-400">Nro. Operación</span><p className="font-medium dark:text-white font-mono text-xs">{scanResult.operationNumber}</p></div>
                  )}
                  {scanResult.confidence !== undefined && (
                    <div><span className="text-gray-400">Confianza</span><p className="font-medium dark:text-white">{scanResult.confidence.toFixed(1)}%</p></div>
                  )}
                </div>

                {scanResult.candidates?.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Seleccionar ticket</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {scanResult.candidates.map((c: any) => (
                        <button key={c.id} onClick={() => handleScanMatch(c.id)}
                          className="w-full text-left border rounded px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200 flex justify-between items-center">
                          <span><strong>#{c.ticketNumber}</strong> — {c.participant.name}</span>
                          <span className="text-xs text-gray-400">{c.participant.phone}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { setScanCreate(true); setScanAmount(String(scanResult.amount || '')); setScanError(''); }}
                    className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-1"><Plus size={14} /> Nuevo Ticket</button>
                  <button onClick={() => { setScanResult(null); loadRaffle(); }}
                    className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cerrar</button>
                </div>

                {scanResult.rawText && (
                  <details className="mt-3">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Texto extraído</summary>
                    <pre className="text-xs text-gray-500 dark:text-gray-400 mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">{scanResult.rawText}</pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDel?.type === 'raffle'}
        title="Eliminar sorteo"
        message="¿Eliminar este sorteo y todos sus tickets? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => { setConfirmDel(null); handleDelete(); }}
        onCancel={() => setConfirmDel(null)}
      />
      <ConfirmModal
        open={confirmDel?.type === 'ticket'}
        title="Eliminar ticket"
        message="¿Eliminar este ticket? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDeleteTicket}
        onCancel={() => setConfirmDel(null)}
      />
    </DashboardLayout>
  );
}