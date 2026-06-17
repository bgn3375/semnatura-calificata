import { list } from '@vercel/blob';

// Admin: lista înscrierilor. Protejat cu ADMIN_KEY (?key=...). Citește fiecare blob
// pentru a întoarce email + dată + sursă (volum mic, pre-lansare).
export default async function handler(req, res) {
  if (!process.env.ADMIN_KEY || req.query.key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ ok: false });
  }
  try {
    const { blobs } = await list({ prefix: 'waitlist/' });
    const rows = await Promise.all(
      blobs.map(async (b) => {
        try {
          const data = await (await fetch(b.url)).json();
          return { email: data.email, source: data.source, ts: data.ts || b.uploadedAt };
        } catch {
          return { email: b.pathname.replace(/^waitlist\//, '').replace(/\.json$/, ''), source: '?', ts: b.uploadedAt };
        }
      })
    );
    rows.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    return res.status(200).json({ ok: true, count: rows.length, signups: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'storage' });
  }
}
