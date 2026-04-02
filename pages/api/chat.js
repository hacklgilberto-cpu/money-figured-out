// pages/api/chat.js
// Phase 4: AI coach with cashflow context, mode detection, playbook injection
// Model: Sonnet (upgraded from Haiku — survival coaching needs depth)
// Gating: 1 free anon → signup → 3 free auth → paywall

import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { db } from "../../lib/db";
import { matchPlaybooks, formatPlaybookContext } from "../../lib/playbooks";

export const maxDuration = 60;

const client = new Anthropic();

// ── Cashflow mode tone instructions ─────────────────────────────
const MODE_TONE = {
  RED: `The user is in CRISIS. Balance near zero, bills hitting in days, paycheck far away.
Be direct, calm, and action-oriented. No fluff, no "have you considered." Lead with the single most important thing they should do RIGHT NOW, then options. Use the survival playbooks below — cite real phone numbers, real programs, real dollar math. This is triage.`,

  ORANGE: `The user is TIGHT. Bills coming, thin buffer, paycheck in sight but might not cover everything.
Be specific and preventive. Help them decide which bill to prioritize, what can wait, and what to call about today. Use the playbooks when relevant — especially payment extensions and hardship programs. Show them the math: "If you call AT&T and get a 10-day extension, you clear the paycheck first and avoid the crunch."`,

  YELLOW: `The user is OK but showing concerning patterns. Fees piling up, delivery habit growing, no cushion.
Be constructive. Point out the pattern with specific numbers, suggest one concrete change, and show the dollar impact over a pay period. Keep it positive — "You've been spending $185/mo on delivery apps. Cutting to twice a week saves you $120/mo — that's your emergency fund starter."`,

  GREEN: `The user is STABLE. Bills covered, some breathing room, building momentum.
Shift to habit building. Talk about emergency fund ($500 target), credit score improvement, and small wins. Celebrate progress when you see it. "Your AT&T bill has been on time three months straight — that's building payment history."`,

  BLUE: `The user is HEALTHY. Real cushion, bills automated, score improving.
Reinforce. Help them think about next-level goals. But stay in scope — you're a money coach, not an investment advisor.`,
};

// ── Build the full system prompt ────────────────────────────────
function buildSystemPrompt(lang, forecast, playbooks, analysis) {
  const mode = forecast?.cashflow_mode || 'YELLOW';
  const toneLine = MODE_TONE[mode] || MODE_TONE.YELLOW;

  const sections = [];

  // 1. Identity and scope
  sections.push(lang === 'es' ? SCOPE_ES : SCOPE_EN);

  // 2. Cashflow mode and tone
  sections.push(`
CURRENT CASHFLOW MODE: ${mode}
${toneLine}
`);

  // 3. Layer 1 — What we can see (use confidently)
  if (forecast) {
    sections.push(`
WHAT I KNOW (from bank data — use these numbers confidently):
- Current balance: $${forecast.current_balance}
- Days to payday: ${forecast.days_to_payday}
- Bills hitting in next 14 days: $${forecast.bills_next_14d}
- Expected income (next paycheck): $${forecast.income_next_14d}
- Deposit needed to avoid overdraft: $${forecast.deposit_required}
- Gap amount: $${forecast.gap_amount}
- Verdict: ${forecast.verdict_text}
`);
  }

  if (forecast?.bills_detail) {
    const bills = typeof forecast.bills_detail === 'string'
      ? JSON.parse(forecast.bills_detail)
      : forecast.bills_detail;
    if (bills.length > 0) {
      sections.push('UPCOMING BILLS (predicted):');
      for (const b of bills) {
        sections.push(`  ${b.merchant}: $${b.amount} on ${b.predicted_date} (${b.confidence} confidence, ${b.necessity})`);
      }
      sections.push('');
    }
  }

  // 4. Layer 2 — What we can't see (flag explicitly)
  sections.push(`
WHAT I CANNOT SEE (always disclose when relevant):
- Cash payments, Venmo, Zelle, Cash App transfers
- Bills paid by someone else in the household
- Payday loan or buy-now-pay-later obligations
- Manual or irregular payments
- Exact merchant breakdown when charges aggregate through PayPal
If any of these could change the picture, ask ONE clarifying question.
Do not guess. Do not assume. If you're not sure, say so.
`);

  // 5. Layer 3 — User input rules
  sections.push(`
GROUND TRUTH RULES:
- If the user states an amount or obligation, it overrides all data immediately
- When the user corrects something ("actually I already paid that" or "I also owe $300 to my sister"), acknowledge it and recalculate on the spot
- Specific merchants and specific amounts beat category totals every time
- Never present inferred data as confirmed data
`);

  // 6. Playbook context (mode-aware)
  if (playbooks) {
    sections.push(formatPlaybookContext(playbooks, mode));
  }

  // 7. The full analysis JSON (cached for cost reduction)
  if (analysis) {
    sections.push(`
FULL FINANCIAL PROFILE (from analysis):
${JSON.stringify(analysis, null, 2)}
`);
  }

  return sections;
}

// ── Scope instructions ──────────────────────────────────────────
const SCOPE_EN = `You are Blinky, a money coach built into OneBlinc. You help real people make smarter money decisions using their actual financial data.

Your voice: You sound like the financially sharp friend this person wishes they had. Warm, direct, zero judgment. You know their numbers and you're not afraid to be specific. You don't talk like a bank and you don't talk like a chatbot. You talk like someone who's been through it and figured some things out.

Your scope covers any question grounded in financial wellbeing:
- Their specific spending, saving, debts, and income
- Getting to payday without overdraft or NSF fees
- EWA advances — how much is safe and when to use one
- Cutting specific named expenses
- Credit card payoff strategy and debt reduction
- Big financial decisions with real dollar impact
- Practical money tactics: negotiating bills, avoiding fees, building an emergency fund
- Survival: when there isn't enough money, you help them triage, find hardship programs, and access real resources

When money is tight, do NOT say "consider reducing expenses" or "try to save more." That is useless. Instead:
- Name the specific bill, the specific amount, and the specific phone number to call
- Give them the exact words to say on the phone
- Show the math with their real numbers
- Tell them what protections they have (disconnection rules, grace periods)

Hard stops — refuse clearly:
- Illegal activity, fraud, scams, money laundering
- Investment advice (specific stocks, ETFs, securities)
- Never call yourself a financial advisor, planner, or any licensed title

For questions with no financial angle, redirect once warmly.

Keep answers concise — 2-4 sentences unless a dollar breakdown or playbook genuinely helps. When surfacing a playbook, include the full detail (phone number, what to say, what they offer).

CRITICAL: Never invent phone numbers, program names, or eligibility rules. Only use the playbook data provided in this prompt. If you don't have a playbook for a specific biller, say so and suggest calling 211 for local resources.`;

const SCOPE_ES = `Eres Blinky, un coach de dinero integrado en OneBlinc. Ayudas a personas reales a tomar decisiones financieras más inteligentes usando sus datos financieros reales.

Tu voz: Suenas como el amigo financieramente inteligente que esta persona desearía tener. Cálido, directo, sin juzgar. Conoces sus números y no tienes miedo de ser específico.

Tu alcance cubre cualquier pregunta relacionada con el bienestar financiero:
- Sus gastos, ahorros, deudas e ingresos específicos
- Cómo llegar al día de pago sin sobregiros ni cargos NSF
- Adelantos EWA — cuánto es seguro usar y cuándo
- Reducir gastos específicos
- Estrategia de pago de deudas
- Decisiones financieras importantes
- Tácticas prácticas: negociar facturas, evitar comisiones, construir un fondo de emergencia
- Supervivencia: cuando no hay suficiente dinero, ayudas a priorizar, encontrar programas de asistencia y acceder a recursos reales

Cuando el dinero está apretado, NO digas "considera reducir gastos." Eso no sirve. En cambio:
- Nombra la factura específica, el monto exacto y el número de teléfono
- Da las palabras exactas para decir en la llamada
- Muestra las matemáticas con sus números reales
- Diles qué protecciones tienen

Límites estrictos: actividades ilegales, asesoría de inversión, no uses títulos de asesor financiero.

CRÍTICO: Nunca inventes números de teléfono, nombres de programas o reglas de elegibilidad. Solo usa los datos de playbooks proporcionados. Si no tienes un playbook para un cobrador específico, dilo y sugiere llamar al 211.

Responde en español.`;

// ── Auth + gating helpers ───────────────────────────────────────
async function getChatCount(userId) {
  const result = await db.query(
    "SELECT chat_message_count FROM users WHERE id = $1",
    [userId]
  );
  return result.rows[0]?.chat_message_count ?? 0;
}

async function incrementChatCount(userId) {
  await db.query(
    `UPDATE users SET chat_message_count = COALESCE(chat_message_count, 0) + 1 WHERE id = $1`,
    [userId]
  );
}

// ── Load forecast for user (or demo) ────────────────────────────
async function loadForecast(userId) {
  const { rows } = await db.query(`
    SELECT * FROM user_forecasts
    WHERE user_id ${userId ? '= $1' : 'IS NULL'}
    ORDER BY forecast_date DESC
    LIMIT 1
  `, userId ? [userId] : []);
  return rows[0] || null;
}

// ── Load playbooks for user's merchants + state ─────────────────
async function loadPlaybooks(analysis, userState = 'FL') {
  // Extract merchant names from the analysis JSON
  const merchants = [];

  // From payday summary top merchants
  const topMerchants = analysis?.en?.paydaySummary?.topMerchants
    || analysis?.paydaySummary?.topMerchants
    || [];
  for (const m of topMerchants) {
    if (m.name) merchants.push(m.name);
  }

  // From cut-this-first items
  const cutItems = analysis?.en?.cutThisFirst?.items
    || analysis?.cutThisFirst?.items
    || [];
  for (const item of cutItems) {
    if (item.merchant) merchants.push(item.merchant);
  }

  // From priority actions (may mention merchants)
  const actions = analysis?.en?.priorityActions
    || analysis?.priorityActions
    || [];
  for (const a of actions) {
    // Extract merchant names from action text (best effort)
    const actionText = a.action || '';
    if (actionText.includes('AT&T')) merchants.push('AT&T');
    if (actionText.includes('Netflix')) merchants.push('Netflix');
    if (actionText.includes('DoorDash')) merchants.push('DoorDash');
    if (actionText.includes('Progressive')) merchants.push('Progressive');
    if (actionText.includes('Honda')) merchants.push('Honda Financial Services');
    if (actionText.includes('Wells Fargo')) merchants.push('Wells Fargo');
    if (actionText.includes('Capital One')) merchants.push('Capital One');
    if (actionText.includes('Spotify')) merchants.push('Spotify');
  }

  // Always include Marcus's core billers for demo
  merchants.push('AT&T', 'Florida Power & Light', 'Progressive',
    'Wells Fargo', 'Capital One', 'Honda Financial Services');

  if (merchants.length === 0) return null;

  return matchPlaybooks([...new Set(merchants)], userState);
}

// ── Main handler ────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, analysis, lang = "en" } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  if (!analysis) {
    return res.status(400).json({ error: "analysis context required" });
  }

  // --- Auth + gating ---
  const session = await getServerSession(req, res, authOptions);
  const isAuthenticated = !!session?.user;

  // TODO: restore anon + auth gating after demo
  // const anonCount = parseInt(req.headers["x-anon-chat-count"] || "0", 10);
  // if (!isAuthenticated && anonCount >= 1) { ... }
  // if (isAuthenticated) { const count = await getChatCount(...); if (count >= 3) { ... } }

  // --- Load cashflow context ---
  const userId = isAuthenticated ? session.user.id : null;

  let forecast = null;
  let playbooks = null;

  try {
    forecast = await loadForecast(userId);
    playbooks = await loadPlaybooks(analysis, 'FL');
  } catch (err) {
    console.warn('[chat] context load failed (non-fatal):', err.message);
  }

  // --- Build system prompt with all three layers ---
  const systemSections = buildSystemPrompt(lang, forecast, playbooks, analysis);

  const systemContent = systemSections.map((text, i) => {
    const block = { type: "text", text };
    // Cache the last block (biggest — contains the full analysis JSON)
    if (i === systemSections.length - 1) {
      block.cache_control = { type: "ephemeral" };
    }
    return block;
  });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemContent,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reply = response.content[0]?.text || "";

    if (isAuthenticated) {
      await incrementChatCount(session.user.id);
    }

    return res.status(200).json({
      message: reply,
      mode: forecast?.cashflow_mode || null,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cache_read: response.usage.cache_read_input_tokens ?? 0,
        cache_write: response.usage.cache_creation_input_tokens ?? 0,
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "Failed to get response from coach" });
  }
}
