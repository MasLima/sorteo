import { createWorker } from 'tesseract.js';

export interface ScanResult {
  rawText: string;
  amount?: number;
  date?: string;
  time?: string;
  operationNumber?: string;
  confidence: number;
}

export async function scanPaymentImage(imagePath: string): Promise<ScanResult> {
  const worker = await createWorker('spa');
  const { data } = await worker.recognize(imagePath);
  await worker.terminate();

  return {
    rawText: data.text,
    amount: parseAmount(data.text),
    date: parseDate(data.text),
    time: parseTime(data.text),
    operationNumber: parseOperationNumber(data.text),
    confidence: data.confidence || 0,
  };
}

function parseAmount(text: string): number | undefined {
  const patterns = [
    /S\/?\s*(\d+[.,]\d{2})/i,
    /S\/?\s*(\d+)/i,
    /total[:\s]*S\/?\s*(\d+[.,]\d{2})/i,
    /monto[:\s]*S\/?\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*soles/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseFloat(m[1].replace(',', '.'));
      if (!isNaN(n) && n > 0) return n;
    }
  }
}

function parseDate(text: string): string | undefined {
  const patterns = [
    /(\d{2})[/-](\d{2})[/-](\d{4})/,
    /(\d{4})[/-](\d{2})[/-](\d{2})/,
    /(\d{2})[/-](\d{2})[/-](\d{2})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      if (m[1].length === 4) return `${m[1]}-${m[2]}-${m[3]}`;
      if (parseInt(m[1]) > 31) continue;
      return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2]}-${m[1]}`;
    }
  }
}

function parseTime(text: string): string | undefined {
  const m = text.match(/(\d{2}):(\d{2})(?:\s*(a\.m\.|p\.m\.))?/i);
  if (m) {
    let h = parseInt(m[1]), min = m[2];
    if (m[3]?.toLowerCase().includes('p.m.') && h !== 12) h += 12;
    if (m[3]?.toLowerCase().includes('a.m.') && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min}`;
  }
}

function parseOperationNumber(text: string): string | undefined {
  const patterns = [
    /(?:ope|operaci[óo]n|nro|n[°])\s*(?:de\s*)?(?:ope|operaci[óo]n)?[:\s]*([A-Z0-9]{6,})/i,
    /(?:c[óo]digo|cod)[:\s]*([A-Z0-9]{6,})/i,
    /(\d{8,})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
}