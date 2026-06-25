import { createWorker } from 'tesseract.js';

export interface ScanResult {
  rawText: string;
  amount?: number;
  confidence: number;
}

export async function scanPaymentImage(imagePath: string): Promise<ScanResult> {
  const worker = await createWorker('spa');
  const { data } = await worker.recognize(imagePath);
  await worker.terminate();

  const rawText = data.text;
  const amount = parseAmount(rawText);
  const confidence = data.confidence || 0;

  return { rawText, amount, confidence };
}

function parseAmount(text: string): number | undefined {
  const patterns = [
    /S\/?\s*(\d+[.,]\d{2})/,
    /S\/?\s*(\d+)/,
    /total[:\s]*S\/?\s*(\d+[.,]\d{2})/i,
    /monto[:\s]*S\/?\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s* soles/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(num) && num > 0) return num;
    }
  }

  return undefined;
}