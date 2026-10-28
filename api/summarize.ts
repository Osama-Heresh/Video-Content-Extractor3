import type { VercelRequest, VercelResponse } from '@vercel/node';
import { summarizeContent, isQuotaError } from '../server/gemini.ts';

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
    const { text, type = 'standard' } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text content is required for summarization.' });
    }

    const validTypes = ['brief', 'standard', 'detailed'];
    const summaryType = validTypes.includes(type) ? type : 'standard';

    const summary = await summarizeContent(text, summaryType as any);
    return res.status(200).json({ summary, type: summaryType });
  } catch (err: any) {
    if (isQuotaError(err)) {
      return res.status(429).json({
        error:
          'Gemini Free Tier daily request quota reached (20/20 requests). Please attach a billing-enabled API key in Settings > Secrets or in Vercel Environment Variables.',
        isQuota: true,
      });
    }
    console.warn('Summarize warning:', err.message || err);
    return res.status(500).json({
      error: err.message || 'Failed to generate summary.',
    });
  }
}
