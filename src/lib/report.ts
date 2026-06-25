// Genera el reporte de marca como HTML branded (mismo look que los one-pagers de outreach).
// Se abre en una ventana nueva y se dispara window.print() → "Guardar como PDF".

import { calcEfficiency, efficiencyHtmlBlock } from "@/lib/efficiency";

const usd = (n: number) => "US$ " + Math.round(n || 0).toLocaleString("es-AR");
const CPM_LOW = 25;
const CPM_MID = 30;
const CPM_HIGH = 35;
function usdEst(n: number): string {
  const mid = Math.max(0, n || 0);
  if (mid <= 0) return "≈ US$ 0";
  const min = Math.round(mid * (CPM_LOW / CPM_MID));
  const max = Math.round(mid * (CPM_HIGH / CPM_MID));
  if (min === max) return `≈ ${usd(mid)}`;
  return `≈ ${usd(min)} – ${usd(max)}`;
}
function usdEstSum(values: number[]): string {
  let min = 0, max = 0, mid = 0;
  for (const v of values) {
    const m = Math.max(0, v || 0);
    min += Math.round(m * (CPM_LOW / CPM_MID));
    max += Math.round(m * (CPM_HIGH / CPM_MID));
    mid += Math.round(m);
  }
  if (mid <= 0) return "≈ US$ 0";
  if (min === max) return `≈ ${usd(mid)}`;
  return `≈ ${usd(min)} – ${usd(max)}`;
}
const num = (n: number) => (n ?? 0).toLocaleString("es-AR");
const compact = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n ?? 0);
};
const esc = (s: string) =>
  (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function fmtHMS(sec: number) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return h ? `${String(h).padStart(2, "0")}:${mm}` : mm;
}

function vodUrl(videoId: string, tSeconds: number) {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(0, Math.floor(tSeconds || 0))}s`;
}

const REPORT_CSS = `
  :root{
    --ink:#15212b; --muted:#5b6b78; --line:#e4e9ee; --bg:#ffffff;
    --accent:#0f7d6b; --accent-soft:#e8f5f1; --gold:#b8862b; --gold-soft:#f7efdc;
    --paid:#0f7d6b;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
       color:var(--ink);background:#f3f5f7;line-height:1.5;padding:32px 16px}
  .page{max-width:760px;margin:0 auto;background:var(--bg);border-radius:14px;
        box-shadow:0 4px 24px rgba(20,33,43,.08);overflow:hidden}
  .head{padding:34px 40px 26px;border-bottom:1px solid var(--line)}
  .kicker{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600}
  h1{font-size:30px;line-height:1.15;margin:8px 0 6px;letter-spacing:-.01em}
  .sub{color:var(--muted);font-size:15px}
  .meta{display:flex;flex-wrap:wrap;gap:18px;margin-top:18px;font-size:13px;color:var(--muted)}
  .meta b{color:var(--ink);font-weight:600}
  .hero{padding:28px 40px;background:linear-gradient(180deg,#fbfdfc,#fff);border-bottom:1px solid var(--line)}
  .hero-grid{display:flex;gap:14px;flex-wrap:wrap}
  .stat{flex:1;min-width:140px;border:1px solid var(--line);border-radius:12px;padding:16px 18px;background:#fff}
  .stat .n{font-size:28px;font-weight:700;letter-spacing:-.02em}
  .stat .l{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.35}
  .stat.paid .n{color:var(--paid)}
  .body{padding:26px 40px 8px}
  .lead{font-size:16px;color:#33424e;margin-bottom:24px}
  .lead b{color:var(--ink)}
  .section-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                 color:var(--muted);margin:8px 0 14px}
  .card{border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:18px}
  .card.compact{padding:16px 18px}
  .tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.04em;
       text-transform:uppercase;padding:4px 10px;border-radius:999px;margin-bottom:10px}
  .tag.paid{background:var(--accent-soft);color:var(--paid)}
  .tag.codigo{background:var(--gold-soft);color:var(--gold)}
  .card h3{font-size:17px;margin-bottom:4px;line-height:1.3}
  .card .when{font-size:13px;color:var(--muted);margin-bottom:12px}
  .quote{border-left:3px solid var(--line);padding:8px 0 8px 16px;margin:12px 0;
         font-style:italic;color:#3a4853;font-size:14px;line-height:1.45}
  .rowstats{display:flex;gap:20px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)}
  .rowstats div{font-size:12px;color:var(--muted);min-width:90px}
  .rowstats b{display:block;font-size:17px;color:var(--ink);font-weight:700;margin-bottom:2px}
  .calc{margin-top:16px;background:#f7faf9;border:1px solid #dceee9;border-radius:10px;padding:14px 16px}
  .calc-title{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--paid);margin-bottom:10px}
  .calc-lead{font-size:14.5px;color:#26433c;margin-bottom:12px;line-height:1.5}
  .calc-lead b{color:var(--ink)}
  .calc-equiv{font-size:13px;color:var(--ink);background:#fff;border:1px solid #dceee9;border-radius:8px;padding:10px 12px;margin-bottom:10px}
  .calc-equiv b{color:var(--paid);font-weight:800}
  .calc-equiv span{color:var(--muted);font-size:11.5px}
  .calc-roi{display:flex;flex-direction:column;gap:8px;border-top:1px dashed #dceee9;padding-top:10px}
  .calc-roi div{font-size:12px;color:#3a4853;line-height:1.45}
  .roi-yes{display:inline-block;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.04em;
           padding:2px 8px;border-radius:999px;margin-right:6px;background:var(--accent-soft);color:var(--paid)}
  .insight{background:var(--accent-soft);border:1px solid #cfe9e2;border-radius:12px;
           padding:18px 22px;margin:6px 0 24px}
  .insight h4{font-size:13px;color:var(--paid);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
  .insight p{font-size:14.5px;color:#26433c;line-height:1.5}
  .summary-bar{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;padding:14px 16px;
               background:#f7faf9;border:1px solid #dceee9;border-radius:10px;font-size:13px;color:#33424e}
  .summary-bar b{color:var(--ink)}
  .method-box{margin:8px 0 24px;padding:18px 22px;background:#fffbeb;border:1px solid #fde68a;
              border-left:4px solid #f59e0b;border-radius:12px}
  .method-box h4{font-size:13px;color:#92400e;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
  .method-row{display:flex;gap:12px;margin-bottom:8px;font-size:12.5px;line-height:1.45;color:#57534e}
  .method-row:last-child{margin-bottom:0}
  .method-row b{flex:0 0 118px;color:#292524;font-size:12px}
  .method-row span{flex:1}
  .efficiency{margin:8px 0 24px;padding:18px 22px;border-radius:12px}
  .efficiency h4{font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
  .eff-lead{font-size:15px;color:#26433c;margin-bottom:12px;line-height:1.5}
  .eff-list{margin:0 0 12px 18px;font-size:13px;color:#3a4853;line-height:1.55}
  .eff-note{font-size:11.5px;color:var(--muted);line-height:1.45}
  .foot{padding:20px 40px 30px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
  .foot b{color:var(--ink)}
  .foot p{margin-bottom:8px;line-height:1.5}
  .vod-link{color:var(--paid);font-weight:600;text-decoration:none}
  .vod-link:hover{text-decoration:underline}
  @media print{
    body{background:#fff;padding:0}
    .page{box-shadow:none;border-radius:0;max-width:100%}
    .card,.insight{break-inside:avoid}
  }
  @page{margin:14mm}
`;

function hasPromoCode(quote: string): boolean {
  const q = (quote || "").toLowerCase();
  return /codigo|código|cupon|cupón|sorteo|promo|descuento|%\s*off|aprovech/.test(q);
}

function extractCode(quote: string): string | null {
  const m = (quote || "").match(
    /(?:codigo|código|cup[oó]n|code)\s+([A-Za-z0-9Á-ú\-_]{2,20})/i
  );
  return m ? m[1].toUpperCase() : null;
}

function tagFor(d: any): { cls: string; label: string } {
  if (d.tier === 3 || hasPromoCode(d.quote || ""))
    return { cls: "codigo", label: "Con código o promo · PNT" };
  if (d.tier === 2)
    return { cls: "paid", label: "Lectura dedicada · PNT" };
  return { cls: "paid", label: "Al pasar · PNT" };
}

function programLabel(d: any): string {
  const t = (d.title || "").replace(/\s+/g, " ").trim();
  return t.length > 72 ? t.slice(0, 69) + "…" : t;
}

export { REPORT_CSS, esc, fmtHMS, vodUrl, num, compact, programLabel };

function venueLine(n: number): string {
  if (n >= 8000) return " — el equivalente a llenar una sala grande, todas viendo tu marca a la vez.";
  if (n >= 4000) return " — una audiencia del tamaño de un teatro lleno, en el minuto exacto de tu lectura.";
  return ".";
}

function mentionCard(d: any, chName: Record<string, string>, featured: boolean): string {
  const tag = tagFor(d);
  const code = extractCode(d.quote || "");
  const canal = esc(chName[d.channel] || d.channel_name || d.channel || "");
  const conc = d.conc_at ? num(d.conc_at) : "—";
  const peak = d.program_peak ? num(d.program_peak) : null;
  const ts = fmtHMS(d.t_seconds || 0);
  const vod = d.video_id ? vodUrl(d.video_id, d.t_seconds || 0) : "";
  const vodA = vod
    ? `<a class="vod-link" href="${esc(vod)}" target="_blank" rel="noreferrer">Ver en YouTube (${ts}) ↗</a>`
    : "";
  const tipo =
    d.tier === 3 || code
      ? code
        ? `código ${code}`
        : "con código o promo"
      : d.tier === 2
        ? "lectura dedicada"
        : "al pasar";

  const calcBlock = featured
    ? `<div class="calc">
        <div class="calc-title">Qué significa esta exposición</div>
        <p class="calc-lead">Tu marca estuvo <b>al aire ante ${conc} personas mirando en vivo al mismo tiempo</b>${d.conc_at ? venueLine(d.conc_at) : ""}</p>
        <div class="calc-equiv">Exposición estimada: <b>${usdEst(d.value_usd)}</b> <span>— benchmark (audiencia al minuto × CPM USD ${CPM_LOW}–${CPM_HIGH} × formato × sentimiento). No es facturación ni ventas.</span></div>
        <div class="calc-roi">
          <div><span class="roi-yes">Verificable</span>cita contrastada con la transcripción · ${vodA || `minuto ${ts}`}${d.precise ? "" : " (aprox.)"}.</div>
          ${code ? `<div><span class="roi-yes">Atribución</span>lectura con código <b>${esc(code)}</b> — compras con ese código son atribuibles a esta aparición.</div>` : `<div><span class="roi-yes">Medición</span>quién te vio, en qué minuto exacto, ante cuánta gente y qué se dijo al aire.</div>`}
        </div>
      </div>`
    : `<div class="calc-equiv" style="margin-top:14px">Exposición: <b>${usdEst(d.value_usd)}</b> <span>· ${conc} en vivo · ${vodA || ts}</span></div>`;

  return `<div class="card${featured ? "" : " compact"}">
    <span class="tag ${tag.cls}">${esc(tag.label)}</span>
    <h3>${canal}${featured ? "" : ` · ${esc(d.date)}`}</h3>
    <div class="when">${esc(programLabel(d))} · ${ts}${vodA ? ` · ${vodA}` : ""}</div>
    <div class="quote">"${esc(d.quote || d.title || "")}"</div>
    <div class="rowstats">
      <div><b>${conc}</b>mirando en ese minuto</div>
      <div><b>${ts}</b>marca en el VOD</div>
      ${peak ? `<div><b>${peak}</b>pico del programa</div>` : ""}
      <div><b>${esc(tipo)}</b>tipo de lectura</div>
    </div>
    ${calcBlock}
  </div>`;
}

export function buildReportHTML(
  r: any,
  ctx: {
    reach: number;
    programs: number;
    topChannel: string;
    chName: Record<string, string>;
    inversionUsd?: number | null;
  }
): string {
  const best = r.best;
  const today = new Date().toLocaleDateString("es-AR");
  const detail: any[] = r.detail || [];
  const channelsLabel = (r.channels || [])
    .map((c: string) => ctx.chName[c] || c)
    .join(" · ");
  const titleSuffix =
    (r.channels || []).length === 1 ? ` en ${ctx.chName[r.channels[0]] || r.channels[0]}` : "";

  const heroConc = best?.conc_at ? num(best.conc_at) : "—";
  const heroPeak = best?.program_peak ? num(best.program_peak) : "—";

  const leadBest = best
    ? best.conc_at
      ? `Lo medí contra la <b>audiencia real del minuto exacto</b> en que se leyó: <b>${heroConc}</b> personas mirando en vivo.`
      : `Registramos <b>${num(r.mentions)}</b> lecturas de pauta verificadas con cita textual.`
    : "";

  const insight =
    best?.conc_at && best?.program_peak
      ? `<div class="insight"><h4>El dato que no se suele ver</h4><p>La mayoría de los reportes te dan el promedio del programa. Tu aparición más fuerte salió con <b>${heroConc} mirando en vivo</b> (pico del programa: ${heroPeak}). Esa es la diferencia entre "el stream tuvo tanta gente" y "tu marca apareció ante tanta gente". Medición independiente, al minuto, con la cita verificada.</p></div>`
      : "";

  const sorted = [...detail].sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0));
  // Siempre la PNT principal (= r.best), no la primera del mismo minuto
  const featured = best || sorted[0];
  const rest = sorted.filter((d) => d.quote !== featured?.quote);

  const featuredHtml = featured ? mentionCard(featured, ctx.chName, true) : "";
  const restHtml =
    rest.length > 0
      ? `<div class="section-label">Otras apariciones (${rest.length})</div>${rest.map((d) => mentionCard(d, ctx.chName, false)).join("")}`
      : "";

  const summaryBar =
    r.mentions > 1
      ? `<div class="summary-bar"><span><b>${num(r.mentions)}</b> PNT verificadas</span><span><b>${ctx.programs}</b> programas</span><span><b>${channelsLabel || ctx.topChannel}</b></span><span>Exposición <b>${usdEst(r.value_usd)}</b></span></div>`
      : "";

  const efficiency =
    ctx.inversionUsd && ctx.inversionUsd > 0
      ? (() => {
          const e = calcEfficiency(ctx.inversionUsd, r.value_usd || 0, r.mentions || 0);
          return e ? efficiencyHtmlBlock(e) : "";
        })()
      : "";

  const methodologyBox = `<div class="method-box">
    <h4>Qué significa la exposición en USD</h4>
    <div class="method-row"><b>Qué es</b><span>Benchmark estimado de exposición publicitaria. <strong>No es lo que la marca pagó</strong>, ni facturación, ni ventas atribuidas.</span></div>
    <div class="method-row"><b>Qué medimos</b><span>Espectadores conectados en el minuto exacto de la PNT, cita textual verificada en el transcript y formato de la pauta.</span></div>
    <div class="method-row"><b>Cómo se calcula</b><span>(concurrentes en vivo ÷ 1.000) × CPM de referencia × formato × sentimiento. CPM ref.: USD ${CPM_LOW}–${CPM_HIGH} (medio ${CPM_MID}).</span></div>
    <div class="method-row"><b>Por qué un rango</b><span>No hay tarifa pública única para PNT en vivo. Mostramos rango estimado, no un precio exacto.</span></div>
    <div class="method-row"><b>Origen del CPM</b><span>Calibración contra tarifas de mercado (~USD 3.000 por PNT en shows top) y benchmarks host-read en vivo (USD 25–40). No es CPM de pre-roll programático.</span></div>
  </div>`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(r.name)} — Exposición en streaming en vivo</title>
<style>${REPORT_CSS}</style></head><body>
<div class="page">
  <div class="head">
    <div class="kicker">Exposición de marca · Streaming en vivo · Eco</div>
    <h1>${esc(r.name)}${esc(titleSuffix)}</h1>
    <div class="sub">Cuánta gente vio tu marca, en qué minuto exacto, y qué dijeron al aire.</div>
    <div class="meta">
      ${best ? `<span><b>Programa:</b> ${esc(programLabel(best))}</span>` : ""}
      ${best ? `<span><b>Emisión:</b> ${esc(best.date)}</span>` : `<span><b>Período:</b> ${today}</span>`}
      ${best?.program_peak ? `<span><b>Pico del programa:</b> ${heroPeak} espectadores</span>` : ""}
      ${best?.video_id ? `<span><b>Verificación:</b> <a class="vod-link" href="${esc(vodUrl(best.video_id, best.t_seconds || 0))}">YouTube ${fmtHMS(best.t_seconds || 0)} ↗</a></span>` : ""}
      ${(r.channels || []).length > 1 ? `<span><b>Canales:</b> ${esc(channelsLabel)}</span>` : ""}
    </div>
  </div>

  <div class="hero">
    <div class="hero-grid">
      <div class="stat paid"><div class="n">${heroConc}</div><div class="l">mirando en vivo en el minuto de la aparición más fuerte</div></div>
      <div class="stat"><div class="n">${heroPeak !== "—" ? heroPeak : num(r.mentions)}</div><div class="l">${heroPeak !== "—" ? "pico de espectadores simultáneos" : "lecturas de pauta (PNT)"}</div></div>
      <div class="stat"><div class="n">${usdEst(r.value_usd)}</div><div class="l">exposición estimada (rango CPM ref.)</div></div>
    </div>
  </div>

  <div class="body">
    <p class="lead"><b>${esc(r.name)}</b> acumula <b>${num(r.mentions)}</b> lecturas de pauta en <b>${ctx.programs}</b> programa${ctx.programs === 1 ? "" : "s"}${channelsLabel ? ` (${esc(channelsLabel)})` : ""}. ${leadBest} Acá está el detalle con prueba textual verificada.</p>
    ${summaryBar}
    ${featuredHtml}
    ${insight}
    ${efficiency}
    ${restHtml}
    ${methodologyBox}
  </div>

  <div class="foot">
    <p><b>Verificación.</b> Solo lecturas de pauta con cita en transcript. Audiencia = concurrentes reales en el minuto exacto (link YouTube arriba). Los USD son benchmark en rango — ver cuadro metodológico.</p>
    <p>Generado por Eco · ${today} · Inteligencia de exposición de marca en streaming argentino en vivo (Olga, Luzu, Bondi, Blender).</p>
  </div>
</div>
</body></html>`;
}
