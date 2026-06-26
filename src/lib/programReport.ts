// Reporte "lindo" por marca x programa — estilo Green Life.
// Una activación concreta, medida contra la audiencia real del minuto exacto.
// Se abre en ventana nueva y dispara print() -> "Guardar como PDF".

import { getChatReaction, chatEcoLine } from "@/lib/chatReaction";

const num = (n: number) => Math.round(n ?? 0).toLocaleString("es-AR");
const usd = (n: number) => "USD " + Math.round(n || 0).toLocaleString("es-AR");
const esc = (s: string) =>
  (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function fmtMin(sec: number) {
  const s = Math.max(0, sec | 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return h ? `${String(h).padStart(2, "0")}:${mm}` : mm;
}

const TIER_LABEL: Record<number, string> = {
  1: "Aparición de pauta · al pasar",
  2: "Mención orgánica",
  3: "Mención (minuto aprox.)",
};

/**
 * @param m  mención enriquecida (quote, t_seconds, conc_at, retention_pct, chat_reaction, value_usd, tier, sentiment, channel_name, title, date)
 * @param peak  pico del programa (program_peak)
 */
export function buildProgramReportHTML(m: any): string {
  const conc = m.conc_at ?? m.views ?? 0;
  const ret = m.retention_pct;
  const chatRx = getChatReaction(m);
  const peak = m.program_peak || m.peak || 0;
  const tier = m.tier || 3;
  const isPaid = tier === 1;
  const retUp = ret != null && ret >= 0;
  const vod = `https://www.youtube.com/watch?v=${m.video_id}&t=${m.t_seconds | 0}s`;

  const retStat =
    ret != null
      ? `<div class="stat"><div class="n">${retUp ? "+" : ""}${ret}%</div><div class="l">la audiencia <b>${retUp ? "creció" : "se movió"}</b> durante el tramo de la mención</div></div>`
      : "";
  const chatStat =
    chatRx.table_line && chatRx.has_chat !== false
      ? `<div class="stat"><div class="n" style="font-size:17px;line-height:1.35">${esc(chatRx.table_line)}</div><div class="l">chat en la ventana de la aparición vs. el promedio del programa</div></div>`
      : chatRx.has_chat === false
        ? `<div class="stat"><div class="n" style="font-size:15px">Sin chat</div><div class="l">no hay captura de chat en este programa</div></div>`
        : "";

  const retRow =
    ret != null
      ? `<div><b>${retUp ? "+" : ""}${ret}%</b>retención durante el tramo</div>`
      : "";

  const retLead =
    ret != null
      ? retUp
        ? `y —esto es lo importante— <b>la audiencia no se fue: ${ret >= 0 ? "creció" : "se mantuvo"} ${Math.abs(ret)}%</b> durante el tramo. La gente se quedó a ver.`
        : `con una variación de audiencia de <b>${ret}%</b> en el tramo (movimiento normal del minuto a minuto).`
      : "";

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(m.brand_name || "Marca")} — ${esc(m.channel_name || "")}</title>
<style>
  :root{--ink:#15212b;--muted:#5b6b78;--line:#e4e9ee;--bg:#fff;--accent:#0f7d6b;--accent-soft:#e8f5f1;--paid:#0f7d6b}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:#f3f5f7;line-height:1.5;padding:32px 16px}
  .page{max-width:760px;margin:0 auto;background:var(--bg);border-radius:14px;box-shadow:0 4px 24px rgba(20,33,43,.08);overflow:hidden}
  .head{padding:34px 40px 26px;border-bottom:1px solid var(--line)}
  .kicker{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600}
  h1{font-size:30px;line-height:1.15;margin:8px 0 6px;letter-spacing:-.01em}
  .sub{color:var(--muted);font-size:15px}
  .meta{display:flex;flex-wrap:wrap;gap:18px;margin-top:18px;font-size:13px;color:var(--muted)}
  .meta b{color:var(--ink);font-weight:600}
  .hero{padding:28px 40px;background:linear-gradient(180deg,#fbfdfc,#fff);border-bottom:1px solid var(--line)}
  .hero-grid{display:flex;gap:14px;flex-wrap:wrap}
  .stat{flex:1;min-width:150px;border:1px solid var(--line);border-radius:12px;padding:16px 18px;background:#fff}
  .stat .n{font-size:30px;font-weight:700;letter-spacing:-.02em}
  .stat .l{font-size:12.5px;color:var(--muted);margin-top:2px}
  .stat.paid .n{color:var(--paid)}
  .body{padding:26px 40px 8px}
  .lead{font-size:16px;color:#33424e;margin-bottom:24px}
  .lead b{color:var(--ink)}
  .card{border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:18px}
  .tag{display:inline-block;font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:4px 10px;border-radius:999px;margin-bottom:10px;background:var(--accent-soft);color:var(--paid)}
  .card h3{font-size:18px;margin-bottom:4px}
  .card .when{font-size:13px;color:var(--muted);margin-bottom:12px}
  .quote{border-left:3px solid var(--line);padding:8px 0 8px 16px;margin:12px 0;font-style:italic;color:#3a4853;font-size:14.5px}
  .rowstats{display:flex;gap:24px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)}
  .rowstats div{font-size:13px;color:var(--muted)}
  .rowstats b{display:block;font-size:18px;color:var(--ink);font-weight:700}
  .calc{margin-top:16px;background:#f7faf9;border:1px solid #dceee9;border-radius:10px;padding:14px 16px}
  .calc-title{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--paid);margin-bottom:12px}
  .calc-lead{font-size:15px;color:#26433c;margin-bottom:12px}
  .calc-lead b{color:var(--ink)}
  .calc-equiv{font-size:13.5px;color:var(--ink);background:#fff;border:1px solid #dceee9;border-radius:8px;padding:10px 12px;margin-bottom:12px}
  .calc-equiv b{color:var(--paid);font-weight:800}
  .calc-equiv span{color:var(--muted);font-size:12px}
  .insight{background:var(--accent-soft);border:1px solid #cfe9e2;border-radius:12px;padding:18px 22px;margin:6px 0 24px}
  .insight h4{font-size:14px;color:var(--paid);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
  .insight p{font-size:15px;color:#26433c}
  .foot{padding:20px 40px 30px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
  .foot b{color:var(--ink)}
  .foot p{margin-bottom:8px}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;max-width:100%}}
</style></head>
<body><div class="page">
  <div class="head">
    <div class="kicker">Exposición de marca · Streaming en vivo</div>
    <h1>${esc(m.brand_name || "Marca")} en ${esc(m.channel_name || "")}</h1>
    <div class="sub">Cuánta gente vio tu aparición, en qué minuto exacto, y qué pasó con la atención.</div>
    <div class="meta">
      <span><b>Programa:</b> ${esc(m.title || m.channel_name || "")}</span>
      <span><b>Emisión:</b> ${esc(m.date || "")}</span>
      ${peak ? `<span><b>Pico del programa:</b> ~${num(peak)} espectadores simultáneos</span>` : ""}
    </div>
  </div>
  <div class="hero"><div class="hero-grid">
    <div class="stat paid"><div class="n">~${num(conc)}</div><div class="l">mirando en vivo en el minuto exacto de la mención</div></div>
    ${retStat}${chatStat}
  </div></div>
  <div class="body">
    <p class="lead">${esc(m.brand_name || "La marca")} salió en <b>${esc(m.title || m.channel_name || "")}</b>. Lo medí contra la <b>audiencia real del minuto exacto</b> y contra lo que pasó con la atención. Acá está el detalle, con la cita verificada contra la transcripción.</p>
    <div class="card">
      <span class="tag">${esc(TIER_LABEL[tier] || "Mención")}</span>
      <h3>${esc(m.brand_name || "Marca")}${m.sentiment ? ` · sentimiento ${esc(m.sentiment)}` : ""}</h3>
      <div class="when">Minuto ${fmtMin(m.t_seconds)} del programa${m.precise ? " · timestamp exacto" : " · minuto aprox."}</div>
      ${m.quote ? `<div class="quote">"${esc(m.quote)}"</div>` : ""}
      <div class="rowstats">
        <div><b>~${num(conc)}</b>mirando en ese minuto exacto</div>
        <div><b>${fmtMin(m.t_seconds)}</b>minuto del programa</div>
        <div><b>${esc((TIER_LABEL[tier] || "").split("·").pop()!.trim() || "mención")}</b>tipo de aparición</div>
        ${retRow}
      </div>
      <div class="calc">
        <div class="calc-title">Qué significa esta exposición</div>
        <p class="calc-lead">Tu marca estuvo al aire ante <b>~${num(conc)} personas mirando en vivo al mismo tiempo</b>${retLead ? ", " + retLead : "."}</p>
        <div class="calc-equiv">Valor de exposición equivalente: <b>≈ ${usd(m.value_usd)}</b> <span>— referencia de mercado de lo que costaría comprar esa misma audiencia en vivo, calculada al minuto (no a promedio del programa). Es benchmark de exposición, no facturación ni ventas.</span></div>
      </div>
    </div>
    <div class="insight"><h4>El dato que no se suele ver</h4><p>La mayoría de los reportes te dan el <b>promedio del programa</b>. Pero tu aparición no salió en el promedio: salió ante <b>~${num(conc)} personas en ese minuto</b>, medido al minuto${ret != null ? ` — y la curva de audiencia ${retUp ? "subió" : "se movió"} mientras pasaba` : ""}. Medición independiente, con la cita verificada contra la transcripción.</p>${chatRx.headline ? `<p style="margin-top:10px"><b>Chat en la pauta:</b> ${esc(chatRx.headline)} <span style="color:#5b6b78">(El chat no certifica pauta.)</span></p>` : ""}${chatEcoLine(m) ? `<p style="margin-top:8px"><b>Eco de comunidad:</b> ${esc(chatEcoLine(m)!)}</p>` : ""}</div>
  </div>
  <div class="foot">
    <p><b>Cómo se mide.</b> La audiencia es la cantidad real de espectadores conectados en vivo en ese minuto exacto, tomada del stream. La retención compara los espectadores al inicio vs. al final del tramo. La cita está verificada contra la transcripción. El valor de exposición es una referencia de mercado conservadora (lente CPM), <b>no facturación ni ventas atribuidas</b>.</p>
    <p>Eco · Inteligencia de exposición de marca en el streaming argentino en vivo (Olga, Luzu, Bondi, Blender). <a href="${vod}">Ver el momento en el VOD →</a></p>
  </div>
</div></body></html>`;
}

export function openProgramReport(m: any) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(buildProgramReportHTML(m));
  w.document.close();
  setTimeout(() => w.print(), 400);
}
