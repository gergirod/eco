// Palco — envío de alertas/brief/reporte desde Vercel.
//
// Reemplaza a correr palco_alerts.py en localhost: lee las fichas ya procesadas
// (Supabase key `palco_entities`, con fallback al JSON del bundle), aplica las
// REGLAS DEL FLAG, renderiza el mail HTML y lo manda con Resend.
//
// La CAPTURA y TRANSCRIPCIÓN siguen corriendo en la máquina residencial (YouTube
// bloquea datacenter y Whisper necesita GPU). Esa máquina empuja `palco_entities`
// a Supabase; Vercel solo lee, evalúa y manda mail.
//
// Uso:
//   GET /api/palco/send?tipo=brief&entity=manuel-adorni            -> preview HTML
//   GET /api/palco/send?tipo=alerta&entity=manuel-adorni&send=1    -> manda mail
//   Cron (vercel.json) llama con header Authorization: Bearer <CRON_SECRET>.
//
// Env vars (Vercel → Project Settings → Environment Variables):
//   RESEND_API_KEY   clave de resend.com
//   PALCO_FROM       remitente verificado, ej "Palco <alertas@tudominio.com>"
//                    (para probar sin dominio: "Palco <onboarding@resend.dev>")
//   PALCO_CRON_SECRET  token que protege la route (igual a CRON_SECRET de Vercel)

import { NextRequest, NextResponse } from "next/server";
import { fetchDataset } from "@/lib/supabase";
import bundled from "@/data/palco_entities.json";
import { CLIENTE, DESTINATARIOS, MODO, REGLAS, SENS } from "@/config/palco";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ---- tipos -------------------------------------------------------------------
interface Ficha {
  video_id: string;
  channel: string;
  program: string;
  date: string;
  views?: number;
  t_seconds: number;
  t_label: string;
  quote: string;
  conc_at: number | null;
  chat_msgs: number;
  chat_ratio: number;
  chat_ex: string[];
  sentiment: "neg" | "neu" | "pos";
  yt_url: string;
  // calculados
  is_crisis?: boolean;
  is_alert?: boolean;
}
interface Radar {
  slug: string;
  entity: string;
  type: string;
  totals: { transcript_mentions: number; chat_mentions: number; programs_with_mentions: number; channels: number };
  sentiment: { neg: number; neu: number; pos: number };
  share_of_voice: { channel: string; mentions: number; pct: number }[];
  crisis: Ficha | null;
  feed: Ficha[];
}
interface Dataset {
  default: string;
  index: { slug: string }[];
  radars: Record<string, Radar>;
}

// ---- reglas del flag (idéntico a palco_alerts.py) ----------------------------
function evaluate(fichas: Ficha[]): Ficha[] {
  const k = SENS[REGLAS.sensibilidad] ?? 1.0;
  const minAud = REGLAS.alerta.min_audiencia_vivo * k;
  const minChat = REGLAS.alerta.min_chat_ratio * k;
  const soloNeg = REGLAS.alerta.solo_negativas;
  const crAud = REGLAS.crisis.min_audiencia_vivo * k;
  const crChat = REGLAS.crisis.min_chat_ratio * k;
  const crNeg = REGLAS.crisis.requiere_negativo;

  for (const f of fichas) {
    const aud = f.conc_at || 0;
    const rat = f.chat_ratio || 0;
    const neg = f.sentiment === "neg";
    f.is_crisis = aud >= crAud && rat >= crChat && (neg || !crNeg);
    let alertOk = aud >= minAud || rat >= minChat;
    if (soloNeg) alertOk = alertOk && neg;
    f.is_alert = f.is_crisis || alertOk;
  }

  // dedupe por entidad+programa: crisis > alerta > más chat > más audiencia
  const dd = REGLAS.dedupe_minutos;
  const seen = new Map<string, number>();
  const out: Ficha[] = [];
  const sorted = [...fichas].sort((a, b) => {
    const ca = a.is_crisis ? 0 : 1, cb = b.is_crisis ? 0 : 1;
    if (ca !== cb) return ca - cb;
    const aa = a.is_alert ? 0 : 1, ab = b.is_alert ? 0 : 1;
    if (aa !== ab) return aa - ab;
    if ((b.chat_ratio || 0) !== (a.chat_ratio || 0)) return (b.chat_ratio || 0) - (a.chat_ratio || 0);
    return (b.conc_at || 0) - (a.conc_at || 0);
  });
  for (const f of sorted) {
    const key = f.video_id;
    const prev = seen.get(key);
    if (prev !== undefined && Math.abs(prev - f.t_seconds) < dd * 60) continue;
    seen.set(key, f.t_seconds);
    out.push(f);
  }
  return out;
}

function inQuietHours(): boolean {
  const rng = REGLAS.horario_silencio;
  if (!rng) return false;
  try {
    const [a, b] = rng.split("-");
    // hora local Argentina
    const now = new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires",
    });
    return a <= b ? a <= now && now < b : now >= a || now < b;
  } catch {
    return false;
  }
}

// ---- render HTML (idéntico a palco_alerts.py) --------------------------------
const CSS = `
body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f4f5f7;margin:0;padding:24px;color:#1a1a1a}
.wrap{max-width:600px;margin:0 auto}
.card{background:#fff;border:1px solid #e6e6e6;border-radius:12px;padding:20px;margin-bottom:14px}
.crisis{border:2px solid #dc2626;background:#fff5f5}
.tag{display:inline-block;font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px}
.neg{background:#fee2e2;color:#b91c1c}.neu{background:#eef;color:#555}.pos{background:#dcfce7;color:#166534}
.q{font-style:italic;color:#333;border-left:3px solid #ddd;padding-left:12px;margin:12px 0;font-size:15px}
.meta{color:#666;font-size:13px}
.big{font-size:30px;font-weight:700}
.btn{display:inline-block;background:#075e54;color:#fff;text-decoration:none;padding:9px 14px;border-radius:8px;font-size:13px;margin-top:10px}
h1{font-size:19px;margin:0 0 4px}.sub{color:#666;font-size:13px;margin:0 0 16px}
.row{display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #f0f0f0}
.brand{font-size:12px;font-weight:700;letter-spacing:2px;color:#2f5fe0}
`;

const esc = (s: string) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nfmt = (n: number) => n.toLocaleString("es-AR").replace(/,/g, ".");
const fecha = () =>
  new Date().toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });

function fichaBlock(f: Ficha, crisis = false): string {
  const tone = { neg: "🔴 negativo", neu: "⚪ neutro", pos: "🟢 positivo" }[f.sentiment];
  const aud = f.conc_at ? nfmt(f.conc_at) : "—";
  const chatEx = f.chat_ex && f.chat_ex.length ? esc(f.chat_ex[0]) : "";
  return `
    <div class="card ${crisis ? "crisis" : ""}">
      ${crisis ? '<div style="color:#dc2626;font-weight:700;margin-bottom:8px">🚨 CRISIS</div>' : ""}
      <div><b>${esc(f.channel)}</b> <span class="tag ${f.sentiment}">${tone}</span></div>
      <div class="meta">${esc(f.program)}</div>
      <div class="q">&ldquo;${esc(f.quote)}&rdquo;</div>
      ${chatEx ? `<div class="meta">💬 la sala: «${chatEx}»</div>` : ""}
      <div class="meta" style="margin-top:8px">👁 <b>${aud}</b> en vivo · 💬 chat ×<b>${f.chat_ratio}</b> · 🕐 ${f.t_label}</div>
      <a class="btn" href="${f.yt_url}">🎬 Ver clip en el minuto exacto</a>
    </div>`;
}

const page = (body: string) =>
  `<html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="wrap">${body}</div></body></html>`;

function renderAlert(entity: string, fichas: Ficha[]) {
  const alerts = fichas.filter((f) => f.is_alert);
  const crisis = alerts.filter((f) => f.is_crisis);
  const lead = (crisis[0] || alerts[0])!;
  const esCrisis = crisis.length > 0;
  const subject = `${esCrisis ? "🚨 PALCO · CRISIS" : "🔴 PALCO · Alerta"} — ${entity} en ${lead.channel}`;
  const blocks = (crisis.length ? crisis : alerts.slice(0, 1)).map((f) => fichaBlock(f, f.is_crisis)).join("");
  const html = page(`
    <div class="brand">PALCO</div>
    <h1>${esCrisis ? "Alerta de crisis" : "Nueva mención relevante"}</h1>
    <p class="sub">${fecha()} · ${entity} · watchlist de ${esc(CLIENTE)}</p>
    ${blocks}
    ${esCrisis ? '<div class="card"><b>Por qué es crisis:</b> mención + audiencia alta + chat disparado + tono negativo, todo al mismo tiempo.</div>' : ""}
  `);
  return { subject, html };
}

function renderBrief(entity: string, fichas: Ficha[]) {
  const hoy = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
  const total = fichas.length;
  const neg = fichas.filter((f) => f.sentiment === "neg").length;
  const pos = fichas.filter((f) => f.sentiment === "pos").length;
  const top = [...fichas].sort((a, b) => (b.conc_at || 0) - (a.conc_at || 0) || (b.chat_ratio || 0) - (a.chat_ratio || 0)).slice(0, 3);
  const canales = new Map<string, number>();
  for (const f of fichas) canales.set(f.channel, (canales.get(f.channel) || 0) + 1);
  const canLine = [...canales.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} (${v})`).join(" · ");
  const html = page(`
    <div class="brand">PALCO</div>
    <h1>Brief del día · ${hoy}</h1>
    <p class="sub">${entity} · watchlist de ${esc(CLIENTE)}</p>
    <div class="card">
      <div class="row"><span>Menciones habladas</span><b>${total}</b></div>
      <div class="row"><span>Tono</span><b>🔴 ${neg} neg · 🟢 ${pos} pos</b></div>
      <div class="row"><span>Canales calientes</span><b>${esc(canLine)}</b></div>
    </div>
    <h1 style="font-size:15px">Top momentos del día</h1>
    ${top.map((f) => fichaBlock(f)).join("")}
  `);
  return { subject: `PALCO · Brief del día ${hoy} — ${entity}, ${total} menciones`, html };
}

function renderReporte(entity: string, radar: Radar, fichas: Ficha[]) {
  const sov = radar.share_of_voice.slice(0, 8);
  const maxv = Math.max(...sov.map((s) => s.mentions), 1);
  const rows = sov.map((s) => {
    const w = Math.round((100 * s.mentions) / maxv);
    return `<div class="row"><span>${esc(s.channel)}</span><span style="flex:1;margin:0 10px"><span style="display:inline-block;height:10px;width:${w}%;background:#2f5fe0;border-radius:6px"></span></span><b>${s.mentions}</b></div>`;
  }).join("");
  const neg = radar.sentiment.neg, pos = radar.sentiment.pos;
  const total = radar.totals.transcript_mentions;
  const top = [...fichas].sort((a, b) => (b.conc_at || 0) - (a.conc_at || 0) || (b.chat_ratio || 0) - (a.chat_ratio || 0)).slice(0, 3);
  const html = page(`
    <div class="brand">PALCO</div>
    <h1>Reporte semanal</h1>
    <p class="sub">${entity} · watchlist de ${esc(CLIENTE)} · ${new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</p>
    <div class="card">
      <div style="font-size:13px;color:#666;margin-bottom:6px">Share of voice por canal</div>
      ${rows}
    </div>
    <div class="card">
      <div class="row"><span>Total menciones</span><b>${total}</b></div>
      <div class="row"><span>Tono de cobertura</span><b>🔴 ${neg} neg · 🟢 ${pos} pos</b></div>
    </div>
    <h1 style="font-size:15px">Momentos que movieron la semana</h1>
    ${top.map((f) => fichaBlock(f, f.is_crisis)).join("")}
  `);
  return { subject: `PALCO · Reporte semanal — ${entity}, ${total} menciones`, html };
}

// ---- envío por Resend --------------------------------------------------------
async function sendEmail(subject: string, html: string, to: string[]) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, info: "RESEND_API_KEY no configurada" };
  const from = process.env.PALCO_FROM || "Palco <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) return { ok: false, info: `Resend ${res.status}: ${await res.text()}` };
  const j = await res.json();
  return { ok: true, info: `enviado (id ${j.id}) a ${to.join(", ")}` };
}

// ---- auth --------------------------------------------------------------------
function authorized(req: NextRequest, token: string | null): boolean {
  const secret = process.env.PALCO_CRON_SECRET;
  if (!secret) return true; // sin secret configurado, no bloquea (dev)
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}` || token === secret;
}

// ---- handler -----------------------------------------------------------------
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const tipo = (sp.get("tipo") || "brief") as "alerta" | "brief" | "reporte";
  const send = sp.get("send") === "1";
  const token = sp.get("token");

  if (!authorized(req, token)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const data = ((await fetchDataset<Dataset>("palco_entities")) || (bundled as unknown as Dataset));
  const entitySlug = sp.get("entity") || data.default;
  const radar = data.radars[entitySlug];
  if (!radar) {
    return NextResponse.json({ error: `entidad '${entitySlug}' no encontrada` }, { status: 404 });
  }

  // fichas = feed + la crisis destacada (si existe y no está ya en el feed)
  const fichasRaw: Ficha[] = [...radar.feed];
  if (radar.crisis && !fichasRaw.some((f) => f.video_id === radar.crisis!.video_id && f.t_seconds === radar.crisis!.t_seconds)) {
    fichasRaw.push(radar.crisis);
  }
  const fichas = evaluate(fichasRaw);

  let subject: string, html: string, note = "";
  if (tipo === "alerta") {
    const pend = fichas.filter((f) => f.is_alert);
    if (!pend.length) {
      return NextResponse.json({ ok: true, note: "Sin menciones sobre el umbral de alerta. Nada para enviar." });
    }
    ({ subject, html } = renderAlert(radar.entity, fichas));
    const hayCrisis = pend.some((f) => f.is_crisis);
    if (inQuietHours() && !hayCrisis) note = "Horario de silencio: la alerta normal esperaría al brief (la crisis igual se manda).";
  } else if (tipo === "brief") {
    ({ subject, html } = renderBrief(radar.entity, fichas));
  } else {
    ({ subject, html } = renderReporte(radar.entity, radar, fichas));
  }

  const stats = {
    alertas: fichas.filter((f) => f.is_alert).length,
    crisis: fichas.filter((f) => f.is_crisis).length,
    modo: MODO,
  };

  // Modo concierge + alerta: nunca manda solo, queda como preview para revisión.
  const concierge = MODO === "concierge" && tipo === "alerta";

  if (send && !concierge) {
    const r = await sendEmail(subject, html, DESTINATARIOS);
    return NextResponse.json({ ok: r.ok, tipo, entity: entitySlug, subject, info: r.info, note, stats });
  }

  if (send && concierge) {
    return NextResponse.json({
      ok: true, tipo, entity: entitySlug, subject, stats,
      note: "Modo concierge: la alerta queda EN COLA. Revisá el preview y confirmá (o pasá MODO a 'auto').",
      preview: `${req.nextUrl.pathname}?tipo=alerta&entity=${entitySlug}`,
    });
  }

  // default: devuelve el HTML para previsualizar en el navegador
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
