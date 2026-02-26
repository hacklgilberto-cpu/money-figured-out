import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { db } from '../../lib/db'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const result = await db.query(
    `SELECT net_worth, assets, liabilities, snapshot_date
     FROM net_worth_snapshots WHERE user_id = $1
     ORDER BY snapshot_date ASC`,
    [session.userId]
  )

  res.json({ snapshots: result.rows })
}
