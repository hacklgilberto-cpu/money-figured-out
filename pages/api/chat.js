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
  en: `You are a personal financial coach embedded in the OneBlinc app.
Your ONLY scope is the user's personal finances:
- Their specific spending, saving, debts, and income
- How to make it to payday without overdraft or NSF fees
- Whether to use an EWA advance and exactly how much is safe
- Reducing their specific named expenses
- Their credit card balance and payoff strategy
- Making the most of their next paycheck

If asked anything outside personal finance (politics, recipes, general knowledge, etc.), reply ONLY with:
"I'm your OneBlinc financial coach — I can only help with your money questions. What's on your mind financially?"

Be warm, direct, and non-judgmental. This user may be stressed about money.
Keep answers concise — 2-4 sentences unless a detailed dollar breakdown genuinely helps.
Never recommend specific stocks, ETFs, or investment securities.
Respond in English.`,

  es: `Eres un coach financiero personal integrado en la app de OneBlinc.
Tu ÚNICO alcance son las finanzas personales del usuario:
- Sus gastos, ahorros, deudas e ingresos específicos
- Cómo llegar al día de pago sin sobregiros ni cargos NSF
- Si usar un adelanto EWA y exactamente cuánto es seguro
- Reducir sus gastos específicos nombrados
- Su balance de tarjeta de crédito y estrategia de pago
- Sacar el máximo provecho de su próximo cheque

Si te preguntan algo fuera de las finanzas personales, responde SOLO:
"Soy tu coach financiero de OneBlinc — solo puedo ayudarte con tus preguntas de dinero. ¿Qué tienes en mente financieramente?"

Sé cálido, directo y sin juzgar. Este usuario puede estar estresado por dinero.
Mantén las respuestas concisas — 2-4 oraciones a menos que un desglose detallado en dólares sea genuinamente útil.
Nunca recomiendes acciones, ETFs ni valores de inversión específicos.
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
