// components/FinancialChat.js
// Blinky — Your Money Guru
// OneBlinc brand: Yellow #F7BB00 | Blue #2B5BAE | Teal #00B5A0 | Grey #4A4A4A
// Font: Nunito Sans (Proxima Nova web-safe match)

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";

const STRINGS = {
  en: {
    buttonLabel: "Ask Blinky",
    headerTitle: "Blinky",
    headerSub: "Your Money Guru",
    welcome:
      "Hey! I already reviewed your full financial picture. What would you like to dig into?",
    placeholder: "Ask about your money...",
    signupTitle: "You're on a roll!",
    signupBody:
      "Create a free OneBlinc account to keep the conversation going and save your history.",
    signupCta: "Create free account",
    signupSub: "Already have one?",
    signupLogin: "Sign in",
    paywallTitle: "Free questions used up",
    paywallBody:
      "Upgrade for unlimited Blinky sessions, saved chat history, and monthly plan refresh.",
    paywallCta: "Upgrade — $9.99/mo",
    paywallSub: "Cancel anytime",
    freeLeft: (n) => `${n} free question${n !== 1 ? "s" : ""} left`,
    errorGeneric: "Something went wrong. Try again in a moment.",
  },
  es: {
    buttonLabel: "Pregunta a Blinky",
    headerTitle: "Blinky",
    headerSub: "Tu Gurú Financiero",
    welcome:
      "¡Hola! Ya revisé tu panorama financiero completo. ¿Qué te gustaría profundizar?",
    placeholder: "Pregunta sobre tu dinero...",
    signupTitle: "¡Vas muy bien!",
    signupBody:
      "Crea una cuenta gratuita de OneBlinc para continuar y guardar tu historial.",
    signupCta: "Crear cuenta gratis",
    signupSub: "¿Ya tienes una?",
    signupLogin: "Iniciar sesión",
    paywallTitle: "Preguntas gratuitas usadas",
    paywallBody:
      "Actualiza para sesiones ilimitadas con Blinky, historial guardado y plan mensual renovado.",
    paywallCta: "Actualizar — $9.99/mes",
    paywallSub: "Cancela cuando quieras",
    freeLeft: (n) =>
      `${n} pregunta${n !== 1 ? "s" : ""} gratis restante${n !== 1 ? "s" : ""}`,
    errorGeneric: "Algo salió mal. Intenta de nuevo en un momento.",
  },
};

const FREE_ANON_LIMIT = 1;

// OneBlinc logo mark — inline SVG recreation of the geometric diamond
function BlinkyMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Teal top-left panel */}
      <polygon points="28,10 52,8 52,42 20,55" fill="#00B5A0" />
      {/* Yellow top-right panel */}
      <polygon points="52,8 78,18 72,48 52,42" fill="#F7BB00" />
      {/* Blue bottom-left panel */}
      <polygon points="20,55 52,42 48,90 18,75" fill="#2B5BAE" />
      {/* Teal bottom-right panel */}
      <polygon points="52,42 72,48 68,88 48,90" fill="#00B5A0" opacity="0.85" />
      {/* White play arrow */}
      <polygon points="36,40 36,68 60,54" fill="white" opacity="0.95" />
    </svg>
  );
}

export default function FinancialChat({ analysis, lang = "en" }) {
  const t = STRINGS[lang] || STRINGS.en;
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: t.welcome },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gate, setGate] = useState(null);
  const [anonCount, setAnonCount] = useState(0);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem("obc_chat_count") || "0", 10);
    setAnonCount(stored);
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open && !gate) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open, gate]);

  const freeLeft = !session ? Math.max(0, FREE_ANON_LIMIT - anonCount) : null;

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    if (!session && anonCount >= FREE_ANON_LIMIT) {
      setGate("signup");
      return;
    }

    const userMsg = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-anon-chat-count": String(anonCount),
        },
        body: JSON.stringify({ messages: newHistory, analysis, lang }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setGate(data.error === "signup_required" ? "signup" : "paywall");
        setMessages(messages);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setMessages([...newHistory, { role: "assistant", content: t.errorGeneric }]);
        setLoading(false);
        return;
      }

      setMessages([...newHistory, { role: "assistant", content: data.message }]);

      if (!session) {
        const newCount = anonCount + 1;
        setAnonCount(newCount);
        localStorage.setItem("obc_chat_count", String(newCount));
      }
    } catch {
      setMessages([...newHistory, { role: "assistant", content: t.errorGeneric }]);
    }

    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap');

    .bw * { font-family: 'Nunito Sans', -apple-system, sans-serif; box-sizing: border-box; }

    .bw-trigger {
      position: fixed; bottom: 24px; right: 24px;
      background: #2B5BAE;
      color: #fff; border: none; border-radius: 50px;
      padding: 12px 20px; font-size: 15px; font-weight: 800;
      cursor: pointer; display: flex; align-items: center; gap: 9px;
      box-shadow: 0 4px 22px rgba(43,91,174,0.4);
      z-index: 9999; transition: all 0.18s ease;
      font-family: 'Nunito Sans', -apple-system, sans-serif;
    }
    .bw-trigger:hover {
      background: #1A3C6E;
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(43,91,174,0.5);
    }
    .bw-badge {
      background: #F7BB00; color: #4A4A4A;
      border-radius: 20px; padding: 2px 9px;
      font-size: 11px; font-weight: 900;
    }

    .bw-panel {
      position: fixed; bottom: 0; right: 0;
      width: 100%; max-width: 400px; height: 530px;
      background: #fff; border-radius: 16px 16px 0 0;
      box-shadow: 0 -4px 40px rgba(0,0,0,0.16);
      display: flex; flex-direction: column;
      z-index: 9999; overflow: hidden;
      font-family: 'Nunito Sans', -apple-system, sans-serif;
      animation: bw-slideup 0.22s cubic-bezier(.2,.8,.4,1);
    }
    @keyframes bw-slideup {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .bw-header {
      background: #2B5BAE;
      padding: 12px 14px;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }
    .bw-header-stripe {
      height: 4px;
      background: linear-gradient(90deg, #F7BB00 0%, #F7BB00 40%, #00B5A0 40%, #00B5A0 100%);
      flex-shrink: 0;
    }

    .bw-messages {
      flex: 1; overflow-y: auto; padding: 14px 13px 6px;
      display: flex; flex-direction: column; gap: 10px;
      background: #F4F6FA;
    }
    .bw-messages::-webkit-scrollbar { width: 3px; }
    .bw-messages::-webkit-scrollbar-thumb { background: #cdd5e0; border-radius: 3px; }

    .bw-msg-user {
      align-self: flex-end; max-width: 82%;
      background: #2B5BAE; color: #fff;
      padding: 10px 14px; border-radius: 18px 18px 4px 18px;
      font-size: 14px; line-height: 1.5;
      box-shadow: 0 2px 8px rgba(43,91,174,0.25);
      white-space: pre-wrap; font-weight: 600;
    }
    .bw-msg-bot {
      align-self: flex-start; max-width: 84%;
      background: #fff; color: #4A4A4A;
      padding: 10px 14px; border-radius: 18px 18px 18px 4px;
      font-size: 14px; line-height: 1.5;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      white-space: pre-wrap;
      border-left: 3px solid #00B5A0;
    }

    .bw-typing {
      align-self: flex-start;
      background: #fff; padding: 11px 15px;
      border-radius: 18px 18px 18px 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      display: flex; gap: 5px; align-items: center;
      border-left: 3px solid #00B5A0;
    }
    .bw-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #00B5A0;
      display: inline-block;
      animation: bw-bounce 1.2s infinite ease-in-out;
    }
    .bw-dot:nth-child(2) { animation-delay: 0.2s; }
    .bw-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bw-bounce {
      0%, 80%, 100% { transform: scale(0.75); opacity: 0.4; }
      40% { transform: scale(1.2); opacity: 1; }
    }

    .bw-inputbar {
      padding: 10px 10px 14px; background: #fff;
      border-top: 1px solid #e5e8ef;
      display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0;
    }
    .bw-textarea {
      flex: 1; border: 1.5px solid #dde2ec;
      border-radius: 12px; padding: 10px 13px;
      font-size: 14px; resize: none; outline: none;
      font-family: 'Nunito Sans', -apple-system, sans-serif;
      line-height: 1.4; color: #4A4A4A; max-height: 80px;
      overflow-y: auto; transition: border-color 0.15s; font-weight: 600;
    }
    .bw-textarea:focus { border-color: #2B5BAE; }
    .bw-textarea::placeholder { font-weight: 400; color: #aab0be; }
    .bw-send {
      width: 40px; height: 40px; border-radius: 12px;
      border: none; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .bw-send:disabled { background: #e8ebf2; cursor: not-allowed; }
    .bw-send:not(:disabled) { background: #2B5BAE; box-shadow: 0 3px 10px rgba(43,91,174,0.3); }
    .bw-send:not(:disabled):hover { background: #1A3C6E; }

    .bw-gate {
      position: absolute; inset: 0;
      background: rgba(255,255,255,0.98);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 28px 24px; text-align: center; gap: 10px;
      animation: bw-fadein 0.2s ease;
    }
    @keyframes bw-fadein { from { opacity: 0; } to { opacity: 1; } }
    .bw-gate h2 { font-size: 20px; font-weight: 800; color: #4A4A4A; margin: 0; }
    .bw-gate p { font-size: 14px; color: #777; line-height: 1.6; margin: 0; max-width: 280px; }
    .bw-gate-btn {
      width: 100%; padding: 13px;
      border: none; border-radius: 12px;
      font-size: 15px; font-weight: 800; cursor: pointer;
      font-family: 'Nunito Sans', -apple-system, sans-serif;
      margin-top: 6px; transition: all 0.15s;
    }
    .bw-gate-blue { background: #2B5BAE; color: #fff; box-shadow: 0 4px 16px rgba(43,91,174,0.3); }
    .bw-gate-blue:hover { background: #1A3C6E; }
    .bw-gate-teal { background: #00B5A0; color: #fff; box-shadow: 0 4px 16px rgba(0,181,160,0.3); }
    .bw-gate-teal:hover { background: #007A6E; }
    .bw-gate-sub { font-size: 12px; color: #aaa; }
    .bw-gate-link {
      background: none; border: none; color: #2B5BAE;
      font-weight: 700; cursor: pointer; font-size: 12px;
      padding: 0; font-family: inherit;
    }
    .bw-close {
      background: rgba(255,255,255,0.15); border: none; color: #fff;
      width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
      font-size: 13px; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s; flex-shrink: 0;
    }
    .bw-close:hover { background: rgba(255,255,255,0.28); }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="bw">

        {/* Floating trigger button */}
        {!open && (
          <button className="bw-trigger" onClick={() => setOpen(true)}>
            <BlinkyMark size={20} />
            {t.buttonLabel}
            {freeLeft !== null && freeLeft > 0 && (
              <span className="bw-badge">{t.freeLeft(freeLeft)}</span>
            )}
          </button>
        )}

        {/* Chat panel */}
        {open && (
          <div className="bw-panel">

            {/* Header */}
            <div className="bw-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "rgba(255,255,255,0.14)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <BlinkyMark size={24} />
                </div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
                    {t.headerTitle}
                  </div>
                  <div style={{ color: "#F7BB00", fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>
                    {t.headerSub}
                  </div>
                </div>
              </div>
              <button className="bw-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            {/* Yellow+teal accent stripe */}
            <div className="bw-header-stripe" />

            {/* Messages */}
            <div className="bw-messages">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "bw-msg-user" : "bw-msg-bot"}>
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="bw-typing">
                  <span className="bw-dot" />
                  <span className="bw-dot" />
                  <span className="bw-dot" />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Gate: Signup */}
            {gate === "signup" && (
              <div className="bw-gate">
                <img
                  src="/OneBlinc.png"
                  alt="OneBlinc"
                  style={{ height: 32, marginBottom: 4 }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div style={{ fontSize: 34 }}>🎯</div>
                <h2>{t.signupTitle}</h2>
                <p>{t.signupBody}</p>
                <button className="bw-gate-btn bw-gate-blue" onClick={() => signIn()}>
                  {t.signupCta}
                </button>
                <div className="bw-gate-sub">
                  {t.signupSub}{" "}
                  <button className="bw-gate-link" onClick={() => signIn()}>
                    {t.signupLogin}
                  </button>
                </div>
              </div>
            )}

            {/* Gate: Paywall */}
            {gate === "paywall" && (
              <div className="bw-gate">
                <img
                  src="/OneBlinc.png"
                  alt="OneBlinc"
                  style={{ height: 32, marginBottom: 4 }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div style={{ fontSize: 34 }}>🔓</div>
                <h2>{t.paywallTitle}</h2>
                <p>{t.paywallBody}</p>
                <button
                  className="bw-gate-btn bw-gate-teal"
                  onClick={() => alert("Stripe checkout coming soon")}
                >
                  {t.paywallCta}
                </button>
                <div className="bw-gate-sub">{t.paywallSub}</div>
              </div>
            )}

            {/* Input bar */}
            {!gate && (
              <div className="bw-inputbar">
                <textarea
                  ref={inputRef}
                  className="bw-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={t.placeholder}
                  rows={1}
                  disabled={loading}
                />
                <button
                  className="bw-send"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke={loading || !input.trim() ? "#aab0be" : "#fff"}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}
