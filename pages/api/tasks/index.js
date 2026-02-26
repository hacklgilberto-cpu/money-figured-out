import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { db } from '../../../lib/db'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const tasks = await db.query(
      `SELECT * FROM tasks WHERE user_id = $1 ORDER BY completed ASC, rank ASC`,
      [session.userId]
    )
    return res.json({ tasks: tasks.rows })
  }

  res.status(405).end()
}
