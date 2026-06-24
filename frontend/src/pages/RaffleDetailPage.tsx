import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import QRCode from 'qrcode';

interface Participant {
  id: string;
  name: string;
  phone: string;
}

interface Ticket {
  id: string;
  ticketNumber: number;
  status: string;
  paymentAmount: number;
  paymentProof: string | null;
  paymentNote: string | null;
  registrationSource: string | null;
  assignedAt: string;
  confirmedAt: string | null;
  participant: Participant;
  registeredBy: { name: string } | null;
}

interface Winner {
  id: string;
  prize: string | null;
  announcedAt: string;
  participant: { name: string; phone: string };
  ticket: { ticketNumber: number };
  registeredBy: { name: string };
}

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  status: string;
  ticketPrice: number;
  yapePhone: string | null;
  maxTickets: number | null;
  startDate: string;
  endDate: string | null;
  tickets: Ticket[];
  winner: Winner | null;
  createdBy: { id: string; name: string };
}

export default function RaffleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const qrYapeCanvas = useRef<HTMLCanvasElement>(null);
  const qrRegCanvas = useRef<HTMLCanvasElement>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editYape, setEditYape] = useState('');
  const [editMax, setEditMax] = useState('');

  const [showRegister, setShowRegister] = useState(false);
  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pAmount, setPAmount] = useState('');

  const [showWinner, setShowWinner] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [prize, setPrize] = useState('');

  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRaffle = async () => {
    try {
      const res = await api.get(`/raffles/${id}`);
      setRaffle(res.data);
    } catch { /* ignore polling errors */ }
  };

  useEffect(() => { loadRaffle(); }, [id]);

  useEffect(() => {
    const interval = setInterval(loadRaffle, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!raffle) return;
    if (qrYapeCanvas.current && raffle.yapePhone) {
      const yapeUrl = `yape://v2/pay?phone=${raffle.yapePhone}&amount=${raffle.ticketPrice}&message=${encodeURIComponent(raffle.title)}`;
      QRCode.toCanvas(qrYapeCanvas.current, yapeUrl, { width: 180, margin: 2 }, (err) => {
        if (err) console.error(err);
      });
    }
    if (qrRegCanvas.current) {
      const regUrl = `${window.location.origin}/pay/${raffle.id}`;
      QRCode.toCanvas(qrRegCanvas.current, regUrl, { width: 180, margin: 2 }, (err) => {
        if (err) console.error(err);
      });
    }
  }, [raffle]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.patch(`/raffles/${id}`, {
        title: editTitle,
        description: editDesc || null,
        ticketPrice: Number(editPrice),
        yapePhone: editYape || null,
        maxTickets: editMax ? Number(editMax) : null,
      });
      setSuccess('Sorteo actualizado');
      setShowEdit(false);
      loadRaffle();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este sorteo y todos sus tickets?')) return;
    setError('');
    try {
      await api.delete(`/raffles/${id}`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm('¿Eliminar este ticket?')) return;
    setError('');
    try {
      await api.delete(`/raffles/tickets/${ticketId}`);
      setSuccess('Ticket eliminado');
      loadRaffle();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar ticket');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/raffles/${id}/tickets`, {
        participantName: pName,
        participantPhone: pPhone,
        participantEmail: pEmail || null,
        paymentAmount: Number(pAmount),
      });
      setSuccess(`Ticket registrado: #${res.data.ticketNumber} - ${res.data.participant.name}`);
      setShowRegister(false);
      setPName(''); setPPhone(''); setPEmail(''); setPAmount('');
      loadRaffle();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar ticket');
    }
  };

  const handleConfirm = async (ticketId: string) => {
    setError('');
    try {
      await api.patch(`/raffles/tickets/${ticketId}/confirm`, { status: 'CONFIRMED' });
      setSuccess('Pago confirmado correctamente');
      loadRaffle();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al confirmar pago');
    }
  };

  const sendNotif = async (endpoint: string, body: Record<string, string>) => {
    setError('');
    setSuccess('');
    try {
      await api.post(`/notifications/${endpoint}`, body);
      setSuccess('Notificación enviada por WhatsApp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar notificación');
    }
  };

  const handleWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post(`/raffles/${id}/winner`, { ticketId, prize: prize || null });
      setSuccess('Ganador registrado correctamente');
      setShowWinner(false);
      setTicketId('');
      setPrize('');
      loadRaffle();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar ganador');
    }
  };

  if (!raffle) {
    return (
      <DashboardLayout>
        <p className="text-gray-500">Cargando...</p>
      </DashboardLayout>
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
    };
    return `px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`;
  };

  const confirmedTickets = raffle.tickets.filter((t) => t.status === 'CONFIRMED').length;
  const pendingTickets = raffle.tickets.filter((t) => t.status === 'PENDING').length;

  return (
    <DashboardLayout>
      <button onClick={() => navigate('/dashboard')} className="text-sm text-blue-600 hover:text-blue-800 mb-4 block">
        &larr; Volver a sorteos
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{raffle.title}</h1>
            {raffle.description && <p className="text-gray-500 mt-1">{raffle.description}</p>}
            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              <span>Precio: <strong>S/.{raffle.ticketPrice}</strong></span>
              {raffle.yapePhone && <span>Yape: <strong>{raffle.yapePhone}</strong></span>}
              <span>Tickets: <strong>{confirmedTickets}/{raffle.maxTickets || '∞'}</strong></span>
              <span>Pendientes: <strong>{pendingTickets}</strong></span>
              <span>Estado: <span className={statusBadge(raffle.status)}>{raffle.status}</span></span>
            </div>
          </div>
          {raffle.status === 'ACTIVE' && (
            <div className="flex gap-2">
              <button onClick={() => setShowRegister(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                + Registrar
              </button>
              {confirmedTickets > 0 && (
                <button onClick={() => setShowWinner(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                  Ganador
                </button>
              )}
            </div>
          )}
          <div className="flex gap-1">
            <button onClick={() => { setEditTitle(raffle.title); setEditDesc(raffle.description || ''); setEditPrice(String(raffle.ticketPrice)); setEditYape(raffle.yapePhone || ''); setEditMax(raffle.maxTickets ? String(raffle.maxTickets) : ''); setShowEdit(true); }}
              className="text-gray-500 hover:text-blue-600 text-xs px-2 py-1">Editar</button>
            <button onClick={handleDelete}
              className="text-gray-500 hover:text-red-600 text-xs px-2 py-1">Eliminar</button>
          </div>
        </div>

        {raffle.yapePhone && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Compartir con participantes:</p>
            <div className="flex items-start gap-8">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">QR para Yapear</p>
                <canvas ref={qrYapeCanvas} className="border rounded inline-block" />
                <p className="text-xs text-gray-400 mt-1">Escanea con Yape</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">QR para Registrarse</p>
                <canvas ref={qrRegCanvas} className="border rounded inline-block" />
                <p className="text-xs text-gray-400 mt-1">Escanea con cámara</p>
              </div>
              <div className="text-sm text-gray-500 pt-6">
                <p>Yapea al número: <strong className="text-gray-800">{raffle.yapePhone}</strong></p>
                <p>Monto: <strong className="text-gray-800">S/.{raffle.ticketPrice}</strong></p>
                <p className="text-xs text-gray-400 mt-2">Luego regístrate con el otro QR</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{success}</div>
      )}

      {raffle.winner && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">Ganador</h3>
              <p className="mt-1">
                {raffle.winner.participant.name} - Ticket #{raffle.winner.ticket.ticketNumber}
                {raffle.winner.prize && ` - Premio: ${raffle.winner.prize}`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Registrado por {raffle.winner.registeredBy.name} el {new Date(raffle.winner.announcedAt).toLocaleDateString()}
              </p>
            </div>
            <button onClick={() => sendNotif('winner', { raffleId: raffle.id })}
              className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700">
              Notificar por WhatsApp
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-3 border-b bg-gray-50">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar participante..."
            className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3"># Ticket</th>
              <th className="text-left px-4 py-3">Participante</th>
              <th className="text-left px-4 py-3">Teléfono</th>
              <th className="text-left px-4 py-3">Monto</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Origen</th>
              <th className="text-left px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {raffle.tickets
              .filter((t) =>
                !search || t.participant.name.toLowerCase().includes(search.toLowerCase()) ||
                t.participant.phone.includes(search)
              )
              .map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">#{t.ticketNumber}</td>
                <td className="px-4 py-3">{t.participant.name}</td>
                <td className="px-4 py-3 text-gray-500">{t.participant.phone}</td>
                <td className="px-4 py-3">S/.{t.paymentAmount}</td>
                <td className="px-4 py-3"><span className={statusBadge(t.status)}>{t.status}</span></td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {t.registrationSource === 'PUBLIC' ? 'Web' : t.registrationSource === 'MANUAL' ? 'Manual' : '-'}
                  <br />
                  <span className="text-gray-400">{t.registeredBy?.name || 'Auto-registro'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    {t.status === 'PENDING' && raffle.status === 'ACTIVE' && (
                      <button onClick={() => handleConfirm(t.id)}
                        className="text-green-600 hover:text-green-800 text-xs font-medium">
                        Confirmar
                      </button>
                    )}
                    {t.status === 'PENDING' && (
                      <button onClick={() => sendNotif('ticket', { ticketId: t.id })}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        WhatsApp
                      </button>
                    )}
                    {t.status === 'CONFIRMED' && (
                      <button onClick={() => sendNotif('payment-confirmed', { ticketId: t.id })}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        WhatsApp
                      </button>
                    )}
                    <button onClick={() => handleDeleteTicket(t.id)}
                      className="text-red-400 hover:text-red-600 text-xs font-medium ml-1">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {raffle.tickets.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay tickets registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Editar Sorteo</h2>
            <form onSubmit={handleEdit}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Título</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" rows={3} />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Precio</label>
                <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">N° Yape</label>
                <input value={editYape} onChange={(e) => setEditYape(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Máx. tickets</label>
                <input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
                <button type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Registrar Ticket</h2>
            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Nombre del participante</label>
                <input value={pName} onChange={(e) => setPName(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Teléfono (WhatsApp)</label>
                <input value={pPhone} onChange={(e) => setPPhone(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required placeholder="+5491112345678" />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Email (opcional)</label>
                <input type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Monto pagado</label>
                <input type="number" step="0.01" value={pAmount} onChange={(e) => setPAmount(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowRegister(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
                <button type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWinner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Registrar Ganador</h2>
            <form onSubmit={handleWinner}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Ticket ganador</label>
                <select value={ticketId} onChange={(e) => setTicketId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required>
                  <option value="">Seleccionar ticket...</option>
                  {raffle.tickets.filter((t) => t.status === 'CONFIRMED').map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.ticketNumber} - {t.participant.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Premio (opcional)</label>
                <input value={prize} onChange={(e) => setPrize(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowWinner(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
                <button type="submit"
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                  Registrar Ganador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
