import { put, list } from '@vercel/blob';

// Colectează înscrierile pe lista de așteptare (pre-lansare). Un blob per email
// (dedupe natural prin overwrite). Stocare publică doar a metadatelor minime.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  const source = String(req.body?.source || 'site').replace(/[^a-z0-9-]+/gi, '').slice(0, 20) || 'site';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    return res.status(400).json({ ok: false, error: 'invalid-email' });
  }

  const safe = email.replace(/[^a-z0-9.@_-]+/gi, '_');
  const payload = JSON.stringify({
    email,
    source,
    ts: new Date().toISOString(),
    ua: String(req.headers['user-agent'] || '').slice(0, 200),
    ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null
  });

  try {
    await put('waitlist/' + safe + '.json', payload, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json'
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'storage' });
  }
}
