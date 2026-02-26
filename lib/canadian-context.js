// Canadian tax context — update annually as CRA publishes new limits
// Last updated: 2026 tax year

const TFSA_ANNUAL_LIMITS = {
  2009: 5000, 2010: 5000, 2011: 5000, 2012: 5000, 2013: 5500,
  2014: 5500, 2015: 10000, 2016: 5500, 2017: 5500, 2018: 5500,
  2019: 6000, 2020: 6000, 2021: 6000, 2022: 6000, 2023: 6500,
  2024: 7000, 2025: 7000, 2026: 7000
}

const PROVINCIAL_MARGINAL_RATES = {
  BC: 0.205, AB: 0.15, SK: 0.145, MB: 0.174,
  ON: 0.1316, QC: 0.25, NB: 0.195, NS: 0.21,
  PEI: 0.167, NL: 0.218
}

export function buildCanadianContext(birthYear, province = 'ON') {
  const currentYear = new Date().getFullYear()
  const age = birthYear ? currentYear - birthYear : 30 // default if not provided

  // TFSA room accumulates from age 18 or 2009, whichever is later
  const tfsaStartYear = birthYear ? Math.max(2009, birthYear + 18) : 2015
  const tfsaLifetimeRoom = Object.entries(TFSA_ANNUAL_LIMITS)
    .filter(([year]) => parseInt(year) >= tfsaStartYear && parseInt(year) <= currentYear)
    .reduce((sum, [, limit]) => sum + limit, 0)

  return {
    tfsaLifetimeRoom,
    tfsaCurrentYearLimit: TFSA_ANNUAL_LIMITS[currentYear] || 7000,
    fhsaEligible: age >= 18 && age <= 71,
    fhsaAnnualLimit: 8000,
    fhsaLifetimeLimit: 40000,
    provincialMarginalRate: PROVINCIAL_MARGINAL_RATES[province] || 0.1316,
    tfsaVsRrspRule: 'TFSA-first if income under $50K; RRSP-first if income over $100K; blend in between',
    note: 'TFSA room assumes no previous contributions — user should verify via CRA MyAccount',
    version: '2026-02',
    source: 'Canada Revenue Agency'
  }
}
