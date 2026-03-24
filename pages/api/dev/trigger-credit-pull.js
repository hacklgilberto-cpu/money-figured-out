import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { runMonthlyPulls } from '../../../lib/creditPullJob'

export const maxDuration = 60

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const userId = session?.userId ?? process.env.MARCUS_USER_ID

  try {
    await runMonthlyPulls(userId)
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
