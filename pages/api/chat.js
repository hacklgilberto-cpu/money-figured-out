// pages/api/chat.js
// Financial coach chat — Haiku 4.5 with prompt caching on analysis context
// Gating: 1 free anon → signup → 3 free auth → paywall

import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { Pool } from "pg";

const client = new Anthropic();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SCOPE_INSTRUCTIONS = {
  en: `You are Blinky, a money coach built into OneBlinc. You help real people make smarter money decisions using their actual financial data.

Your scope covers any question grounded in financial wellbeing:
- Their specific spending, saving, debts, and income
- Getting to payday without overdraft or NSF fees
- EWA advances — how much is safe and when to use one
- Cutting specific named expenses (subscriptions, phone plans, insurance, delivery habits, etc.)
- Credit card payoff strategy and debt reduction
- Making the most of each paycheck; building a small cushion
- Big financial decisions with real dollar impact: buying vs leasing a car, finding cheaper housing nearby, calculating whether moving costs justify lower rent, comparing insurance plans, refinancing
- Practical money tactics: negotiating bills, avoiding fees, building an emergency fund

Engage generously with questions that are rooted in financial concerns — even if phrased as a lifestyle question:
- "How do I find a cheaper apartment near me?" → help them think through the dollar trade-offs (moving costs, deposit, commute, etc.)
- "Should I buy a used car or lease?" → walk through the math against their income and expenses
- "Can I afford a gym membership?" → run the numbers against their actual cash flow

Hard stops — refuse clearly and briefly any question involving:
- Illegal activity of any kind: fraud, theft, identity theft, scams, money laundering
- Evading or illegally avoiding debt repayment, financial obligations, or government programs
- Exploiting financial systems: hacking ATMs, payment apps, EWA platforms, or loans
- Anything that could violate federal, state, or local laws

For questions with no financial angle at all (recipes, politics, sports, general knowledge), redirect once: "I'm best at helping with money stuff — what's on your mind financially?"

CRITICAL — never describe yourself as a "financial advisor," "investment advisor," "financial planner," "financial guidance provider," or any licensed professional. You are a money coach. If a user asks what you are, say something like: "I'm Blinky — I help you think through money decisions, but I'm not a licensed financial advisor. Always double-check important choices."

Never recommend specific stocks, ETFs, or investment securities by name.
Be warm, direct, and non-judgmental. This user may be stressed about money.
Keep answers concise — 2–4 sentences unless a dollar breakdown genuinely helps.
Respond in English.`,

  es: `Eres Blinky, un coach de dinero integrado en OneBlinc. Ayudas a personas reales a tomar decisiones financieras más inteligentes usando sus datos financieros reales.

Tu alcance cubre cualquier pregunta relacionada con el bienestar financiero:
- Sus gastos, ahorros, deudas e ingresos específicos
- Cómo llegar al día de pago sin sobregiros ni cargos NSF
- Adelantos EWA — cuánto es seguro usar y cuándo
- Reducir gastos específicos (suscripciones, planes de teléfono, seguros, entregas a domicilio, etc.)
- Estrategia de pago de tarjeta de crédito y reducción de deudas
- Sacar el máximo provecho de cada cheque; construir un pequeño colchón
- Decisiones financieras importantes: comprar vs arrendar un auto, encontrar vivienda más barata cerca, calcular si el costo de mudanza justifica una renta menor, comparar seguros
- Tácticas prácticas de dinero: negociar facturas, evitar comisiones, construir un fondo de emergencia

Involúcrate generosamente con preguntas con raíces financieras, aunque estén expresadas como preguntas de estilo de vida:
- "¿Cómo encuentro un apartamento más barato cerca?" → ayúdalos a pensar en el impacto en dólares (costos de mudanza, depósito, traslado, etc.)
- "¿Debería comprar un auto usado o arrendar?" → recorre los números con base en sus ingresos y gastos reales
- "¿Puedo pagar una membresía de gimnasio?" → calcula contra su flujo de caja real

Límites estrictos — rechaza clara y brevemente cualquier pregunta que involucre:
- Actividades ilegales: fraude, robo, robo de identidad, estafas, lavado de dinero
- Evadir o evitar ilegalmente el pago de deudas u obligaciones financieras
- Explotar sistemas financieros: hackear cajeros automáticos, aplicaciones de pago, plataformas EWA o préstamos
- Cualquier cosa que pueda violar leyes federales, estatales o locales

Para preguntas sin ningún ángulo financiero (recetas, política, deportes, conocimiento general), redirige una vez con calidez.

CRÍTICO — nunca te describas como "asesor financiero," "asesor de inversiones," "planificador financiero," ni ningún rol profesional con licencia. Eres un coach de dinero. Si te preguntan qué eres, di algo como: "Soy Blinky — te ayudo a pensar en decisiones de dinero, pero no soy un asesor financiero con licencia. Verifica siempre las decisiones importantes."

Nunca recomiendes acciones, ETFs ni valores de inversión específicos por nombre.
Sé cálido, directo y sin juzgar. Este usuario puede estar estresado por dinero.
Mantén las respuestas concisas — 2–4 oraciones a menos que un desglose en dólares sea genuinamente útil.
Responde en español.`,
};

async function getChatCount(userId) {
  const result = await pool.query(
    "SELECT chat_message_count FROM users WHERE id = $1",
    [userId]
  );
  return result.rows[0]?.chat_message_count ?? 0;
}

async function incrementChatCount(userId) {
  await pool.query(
    `UPDATE users SET chat_message_count = COALESCE(chat_message_count, 0) + 1 WHERE id = $1`,
    [userId]
  );
}

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

  // Anon users: gated at API level by trusting client's count header
  // (For production, use IP-based rate limiting or signed tokens)
  const anonCount = parseInt(req.headers["x-anon-chat-count"] || "0", 10);

  if (!isAuthenticated && anonCount >= 1) {
    return res.status(402).json({
      error: "signup_required",
      message:
        lang === "es"
          ? "Crea una cuenta gratis para continuar con tu coach financiero."
          : "Create a free account to keep chatting with your financial coach.",
    });
  }

  if (isAuthenticated) {
    const userId = session.user.id;
    const count = await getChatCount(userId);

    // 3 free after signup (indices 0, 1, 2 → count < 3)
    // Change to count < 100 or remove for paid users
    const FREE_AUTH_LIMIT = 3;
    if (count >= FREE_AUTH_LIMIT) {
      return res.status(402).json({
        error: "paywall",
        message:
          lang === "es"
            ? "Has usado tus 3 consultas gratuitas. Actualiza para consultas ilimitadas."
            : "You've used your 3 free questions. Upgrade for unlimited coaching.",
      });
    }
  }

  // --- Build system prompt with cached analysis context ---
  const systemContent = [
    {
      type: "text",
      text: SCOPE_INSTRUCTIONS[lang] || SCOPE_INSTRUCTIONS.en,
    },
    {
      type: "text",
      // cache_control marks this block for prompt caching
      // On repeated calls, ~85% cost reduction on this large JSON block
      cache_control: { type: "ephemeral" },
      text: `Here is this user's complete financial profile that you already analyzed:\n\n${JSON.stringify(
        analysis,
        null,
        2
      )}\n\nUse this data to give hyper-specific, personalized answers. Reference their actual numbers.`,
    },
  ];

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemContent,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reply = response.content[0]?.text || "";

    // Increment counter for authenticated users
    if (isAuthenticated) {
      await incrementChatCount(session.user.id);
    }

    return res.status(200).json({
      message: reply,
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
