import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { db } from '../../../lib/db'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const result = await db.query(
      `SELECT id, institution_name, last_synced_at, created_at
       FROM plaid_items WHERE user_id = $1 AND revoked_at IS NULL`,
      [session.userId]
    )
    return res.json({ accounts: result.rows })
  }

  if (req.method === 'DELETE') {
    const { itemId } = req.body
    await db.query(
      'UPDATE plaid_items SET revoked_at = now() WHERE id = $1 AND user_id = $2',
      [itemId, session.userId]
    )
    return res.json({ success: true })
  }

  res.status(405).end()
}
