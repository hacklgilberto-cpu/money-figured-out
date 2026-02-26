import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { plaidClient } from '../../../lib/plaid'
import { db } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const { public_token } = req.body
  if (!public_token) return res.status(400).json({ error: 'public_token required' })

  try {
    // Exchange public token for access token
    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token })
    const accessToken = exchangeRes.data.access_token
    const itemId = exchangeRes.data.item_id

    // Get institution name
    let institutionName = 'Bank'
    try {
      const itemInfo = await plaidClient.itemGet({ access_token: accessToken })
      const instId = itemInfo.data.item.institution_id
      if (instId) {
        const instRes = await plaidClient.institutionsGetById({
          institution_id: instId,
          country_codes: ['CA', 'US'],
        })
        institutionName = instRes.data.institution.name
      }
    } catch (e) {
      console.warn('Could not fetch institution name:', e.message)
    }

    // Check if this item is already connected (avoid duplicates)
    const existing = await db.query(
      'SELECT id FROM plaid_items WHERE item_id = $1 AND user_id = $2 AND revoked_at IS NULL',
      [itemId, session.userId]
    )
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'This bank is already connected.' })
    }

    // Save to DB
    await db.query(
      `INSERT INTO plaid_items (user_id, access_token, item_id, institution_name, last_synced_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (item_id) DO UPDATE SET revoked_at = NULL, last_synced_at = now()`,
      [session.userId, accessToken, itemId, institutionName]
    )

    res.json({ success: true, institutionName })
  } catch (err) {
    console.error('add-account error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to connect bank account' })
  }
}
