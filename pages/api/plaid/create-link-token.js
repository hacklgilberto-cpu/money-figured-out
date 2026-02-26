import { plaidClient } from '../../../lib/plaid'
import { CountryCode, Products } from 'plaid'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { lang = 'en' } = req.body || {}
  const plaidLang = lang === 'FR' ? 'fr' : 'en'

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'anonymous-' + Date.now() },
      client_name: 'Your Money, Figured Out',
      products: [Products.Transactions],
      country_codes: [CountryCode.Ca, CountryCode.Us],
      language: plaidLang
    })

    res.json({ link_token: response.data.link_token })
  } catch (error) {
    console.error('Plaid link token error:', error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to create Plaid link token' })
  }
}
