import type { VercelRequest, VercelResponse } from '@vercel/node';
import { transcribeMediaWithGemini, isQuotaError } from '../server/gemini.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { base64Data, mimeType, fileName } = req.body || {};
    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'base64Data and mimeType are required for transcription.' });
    }

    const result = await transcribeMediaWithGemini(base64Data, mimeType, fileName);
    return res.status(200).json(result);
  } catch (err: any) {
    if (isQuotaError(err)) {
      return res.status(429).json({
        error:
          'Gemini Free Tier daily request quota reached (20/20 requests). Please attach a billing-enabled API key in Settings > Secrets or in Vercel Environment Variables to transcribe media.',
        isQuota: true,
      });
    }
    console.warn('Transcribe media warning:', err.message || err);
    return res.status(500).json({
      error: err.message || 'Media transcription failed.',
    });
  }
}
