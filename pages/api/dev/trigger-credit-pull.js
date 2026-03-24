import { runMonthlyPulls } from '../../../lib/creditPullJob'

export const maxDuration = 60

export default async function handler(req, res) {
  try {
    await runMonthlyPulls()
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
