import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractContentFromUrl } from '../server/extractor.ts';
import { validateSafeUrl } from '../server/security.ts';

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
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'A valid URL string is required.' });
    }

    const trimmedUrl = url.trim();
    const validation = await validateSafeUrl(trimmedUrl);
    if (validation.error || !validation.safeUrl) {
      return res.status(400).json({ error: validation.error || 'Invalid destination URL.' });
    }

    const result = await extractContentFromUrl(trimmedUrl);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Extraction error on Vercel:', err);
    return res.status(500).json({
      error: err.message || 'An unexpected error occurred during content extraction.',
    });
  }
}
