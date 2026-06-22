import twilio from 'twilio';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';

function getTwilioClient() {
  if (!twilioAccountSid || !twilioAuthToken) return null;
  return twilio(twilioAccountSid, twilioAuthToken);
}

export async function sendWhatsApp(
  to: string,
  message: string,
  metadata?: { raffleId?: string; ticketId?: string; userId?: string },
) {
  const client = getTwilioClient();

  if (!client) {
    logger.warn('Twilio no configurado - mensaje no enviado', { to, message });
    await logNotification('whatsapp', to, message, 'SKIPPED', 'Twilio no configurado', metadata);
    return { status: 'SKIPPED', reason: 'Twilio no configurado' };
  }

  try {
    const formattedNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: formattedNumber,
      body: message,
    });

    logger.info('WhatsApp enviado', { to, sid: result.sid });
    await logNotification('whatsapp', to, message, 'SENT', null, metadata);
    return { status: 'SENT', sid: result.sid };
  } catch (error) {
    const errorMsg = (error as Error).message;
    logger.error('Error al enviar WhatsApp', { to, error: errorMsg });
    await logNotification('whatsapp', to, message, 'FAILED', errorMsg, metadata);
    return { status: 'FAILED', error: errorMsg };
  }
}

async function logNotification(
  type: string,
  to: string,
  message: string,
  status: string,
  error: string | null,
  metadata?: { raffleId?: string; ticketId?: string; userId?: string },
) {
  await prisma.notificationLog.create({
    data: {
      type,
      to,
      message,
      status,
      error,
      raffleId: metadata?.raffleId || null,
      ticketId: metadata?.ticketId || null,
      userId: metadata?.userId || null,
    },
  });
}

export function buildTicketMessage(participantName: string, raffleTitle: string, ticketNumber: number): string {
  return (
    `Hola ${participantName}! 🎟️\n\n` +
    `Te confirmamos que has sido registrado en el sorteo *${raffleTitle}*.\n\n` +
    `Tu número de ticket es: *${ticketNumber}*\n\n` +
    `Mucha suerte! 🍀`
  );
}

export function buildPaymentConfirmedMessage(
  participantName: string,
  raffleTitle: string,
  ticketNumber: number,
): string {
  return (
    `Hola ${participantName}! ✅\n\n` +
    `Tu pago para el sorteo *${raffleTitle}* ha sido confirmado.\n\n` +
    `Tu ticket #${ticketNumber} está activo.\n\n` +
    `Mucha suerte! 🍀`
  );
}

export function buildWinnerMessage(
  participantName: string,
  raffleTitle: string,
  ticketNumber: number,
  prize?: string,
): string {
  const prizeText = prize ? `\nPremio: *${prize}*` : '';
  return (
    `🎉 *FELICIDADES* ${participantName}! 🎉\n\n` +
    `Has ganado el sorteo *${raffleTitle}* con el ticket #${ticketNumber}!${prizeText}\n\n` +
    `Te contactaremos a la brevedad para coordinar la entrega de tu premio.`
  );
}

export async function getNotificationLog(raffleId?: string) {
  return prisma.notificationLog.findMany({
    where: raffleId ? { raffleId } : undefined,
    orderBy: { sentAt: 'desc' },
    take: 100,
  });
}
