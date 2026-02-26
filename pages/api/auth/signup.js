import bcrypt from 'bcryptjs'
import { db } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, roadmapId } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  // Check if email already exists
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  )
  if (existing.rows[0]) {
    return res.status(409).json({ error: 'Email already registered' })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const result = await db.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
    [email.toLowerCase(), hashedPassword]
  )
  const userId = result.rows[0].id

  // Claim the roadmap that was generated before signup
  if (roadmapId) {
    await db.query(
      'UPDATE roadmaps SET user_id = $1 WHERE id = $2 AND user_id IS NULL',
      [userId, roadmapId]
    )
    await db.query(
      'UPDATE tasks SET user_id = $1 WHERE roadmap_id = $2 AND user_id IS NULL',
      [userId, roadmapId]
    )
    // Save first net worth snapshot
    const roadmap = await db.query(
      'SELECT analysis FROM roadmaps WHERE id = $1',
      [roadmapId]
    )
    if (roadmap.rows[0]) {
      const analysis = roadmap.rows[0].analysis
      await db.query(
        'INSERT INTO net_worth_snapshots (user_id, net_worth, assets, liabilities) VALUES ($1, $2, $3, $4)',
        [
          userId,
          analysis.netWorthStatement.netWorth,
          analysis.netWorthStatement.totalAssets,
          analysis.netWorthStatement.totalLiabilities
        ]
      )
    }
  }

  res.status(201).json({ success: true, userId })
}
