# UI and copy rules

Applies to: `pages/**/*.js`, `styles/**/*.css`, `components/**/*.js`

## Framework
- Next.js 14 with pages router (not App Router)
- No new dependencies without confirming they work in Vercel serverless
- Tailwind is not in the stack — use CSS modules or inline styles

## Copy rules (non-negotiable)
- Never use net worth language
- Never use negative financial framing ("you're bad at saving", "you overspend on")
- No dashes connecting ideas in copy — use commas or restructure the sentence
- Delivery apps (DoorDash, Uber Eats, etc.) are grouped as a single line item
- Streaming services listed with commas: "Netflix, Hulu, Disney+" not "Netflix + Hulu + Disney+"
- Tim Hortons is the coffee comparison reference for Canadian context

## Cashflow mode UI behavior
- RED and ORANGE: do not surface VantageScore or credit path — survival first
- YELLOW, GREEN, BLUE: credit path and score may be shown
- The 14-day map is always the primary view regardless of mode

## Dashboard structure (Phase 3+)
- Primary: today's balance, day-by-day 14-day projection, deposit amount needed
- Secondary: upcoming bills list (merchant logo, predicted date, predicted amount, necessity level)
- Tertiary: fee history panel (last 90 days, total cost surfaced)
- The deposit widget copy: "To stay safe through [date], put in $X" — specific, not a warning banner
