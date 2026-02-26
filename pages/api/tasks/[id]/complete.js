import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { db } from '../../../../lib/db'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).end()

  const { id } = req.query

  const result = await db.query(
    `UPDATE tasks SET completed = true, completed_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, session.userId]
  )

  if (!result.rows[0]) return res.status(404).json({ error: 'Task not found' })

  // Recalculate total annual impact from completed tasks
  const impact = await db.query(
    `SELECT COALESCE(SUM(annual_impact), 0) as total
     FROM tasks WHERE user_id = $1 AND completed = true`,
    [session.userId]
  )

  res.json({
    task: result.rows[0],
    totalCompletedImpact: impact.rows[0].total
  })
}
