// pages/api/cron/credit-pull.js
// Nightly Vercel cron trigger for the monthly credit pull job.
// Schedule is registered in vercel.json.
// Can also be called manually via POST for testing.

export const maxDuration = 60;

import { runMonthlyPulls } from '../../../lib/creditPullJob';

export default async function handler(req, res) {
  // Guard: only allow Vercel cron or internal calls
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await runMonthlyPulls();
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[cron/credit-pull] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
