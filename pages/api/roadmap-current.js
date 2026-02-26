import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { db } from '../../lib/db'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const result = await db.query(
    `SELECT id, analysis, created_at FROM roadmaps
     WHERE user_id = $1 AND is_current = true
     ORDER BY created_at DESC LIMIT 1`,
    [session.userId]
  )

  if (!result.rows[0]) return res.status(404).json({ error: 'No roadmap found' })

  res.json({
    roadmapId: result.rows[0].id,
    analysis: result.rows[0].analysis,
    createdAt: result.rows[0].created_at,
  })
}
