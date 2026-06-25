import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formatMoney } from '../utils/format';

interface RaffleInfo {
  id: string;
  title: string;
  description: string | null;
  ticketPrice: number;
  yapePhone: string | null;
}

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const [raffle, setRaffle] = useState<RaffleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState<{ ticketNumber: number; participantName: string } | null>(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/public/raffles/${id}`);
        if (!res.ok) throw new Error('Sorteo no encontrado');
        const data = await res.json();
        setRaffle(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/public/register-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId: id,
          participantName: name,
          participantPhone: phone,
          paymentAmount: raffle!.ticketPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setSuccess(`¡Registrado exitosamente!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-xl font-bold text-red-600">Sorteo no encontrado</h1>
          <p className="text-gray-500 mt-2">El sorteo no está disponible o ha finalizado.</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h1 className="text-xl font-bold text-gray-800">¡Registrado exitosamente!</h1>
          <p className="mt-4 text-gray-600">
            {result.participantName}, tu ticket <strong>#{result.ticketNumber}</strong>
            para <strong>{raffle.title}</strong> está pendiente de confirmación.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            El organizador verificará tu pago y te notificará por WhatsApp.
          </p>
          <a href={`https://wa.me/${raffle.yapePhone}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-block mt-6 bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-700">
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800">{raffle.title}</h1>
        {raffle.description && <p className="text-gray-500 mt-1 text-sm">{raffle.description}</p>}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-800 font-medium">Datos para el pago:</p>
          <p className="text-lg font-bold mt-1">
            Yapea a: <span className="text-blue-700">{raffle.yapePhone || '—'}</span>
          </p>
          <p className="text-lg font-bold">
            Monto: <span className="text-blue-700">{formatMoney(raffle.ticketPrice)}</span>
          </p>
        </div>

        {raffle.yapePhone && (
          <>
            <a href={`yape://v2/pay?phone=${raffle.yapePhone}&amount=${raffle.ticketPrice}&message=${encodeURIComponent(raffle.title)}`}
              className="flex items-center justify-center gap-2 mt-4 bg-green-600 text-white w-full py-3 rounded-lg font-medium hover:bg-green-700">
              <span>Pagar con Yape</span>
            </a>
            <p className="text-xs text-gray-400 mt-1 text-center">
              Si no se abre Yape, paga al número: <strong>{raffle.yapePhone}</strong>
            </p>
          </>
        )}

        <hr className="my-6" />

        <h2 className="font-semibold text-gray-700 mb-3">Ya pagaste? Regístrate</h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Tu nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" required placeholder="Ej: Juan Pérez" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tu celular (WhatsApp)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" required placeholder="51987123456" />
          </div>
          <button type="submit" disabled={submitting}
            className="bg-blue-600 text-white w-full py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Registrando...' : 'Ya pagué, registrarme'}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Tu registro quedará pendiente hasta que el organizador confirme tu pago.
        </p>
      </div>
    </div>
  );
}