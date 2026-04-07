export default function handler(req, res) {
  res.status(410).json({ error: 'Endpoint removed. Balance history is available via /api/cashflow.' })
}
