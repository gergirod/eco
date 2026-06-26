// Certificado de emisión — producto canal (comercial del stream, no auditoría de precio).
// HTML → window.print() → PDF.

import { prominenceLabel } from "@/lib/prominence";
import { usdEst } from "@/lib/valuation";
import type { PntRow, Program } from "@/lib/programs";

const usd = (n: number) => "US$ " + Math.round(n || 0).toLocaleString("es-AR");
const num = (n: number) => (n ?? 0).toLocaleString("es-AR");
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

function programTitle(p: Program) {
  const t = (p.title || "").replace(/\s+/g, " ").trim();
  return t.length > 88 ? t.slice(0, 85) + "…" : t;
}

const CERT_CSS = `
  :root{--ink:#15212b;--muted:#5b6b78;--line:#e4e9ee;--bg:#fff;--accent:#2f5fe0;--accent-soft:#eef3ff}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
       color:var(--ink);background:#f3f5f7;line-height:1.5;padding:32px 16px}
  .page{max-width:760px;margin:0 auto;background:var(--bg);border-radius:14px;
        box-shadow:0 4px 24px rgba(20,33,43,.08);overflow:hidden}
  .head{padding:34px 40px 26px;border-bottom:1px solid var(--line)}
  .kicker{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600}
  h1{font-size:28px;line-height:1.15;margin:8px 0 6px;letter-spacing:-.01em}
  .sub{color:var(--muted);font-size:15px}
  .meta{display:flex;flex-wrap:wrap;gap:18px;margin-top:18px;font-size:13px;color:var(--muted)}
  .meta b{color:var(--ink);font-weight:600}
  .hero{padding:28px 40px;background:linear-gradient(180deg,#f7f9ff,#fff);border-bottom:1px solid var(--line)}
  .hero-grid{display:flex;gap:14px;flex-wrap:wrap}
  .stat{flex:1;min-width:140px;border:1px solid var(--line);border-radius:12px;padding:16px 18px;background:#fff}
  .stat .n{font-size:28px;font-weight:700;letter-spacing:-.02em;color:var(--accent)}
  .stat .l{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.35}
  .body{padding:26px 40px 8px}
  .lead{font-size:16px;color:#33424e;margin-bottom:24px}
  .lead b{color:var(--ink)}
  .section-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                 color:var(--muted);margin:20px 0 14px}
  .card{border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:18px}
  .tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.04em;
       text-transform:uppercase;padding:4px 10px;border-radius:999px;margin-bottom:10px;
       background:var(--accent-soft);color:var(--accent)}
  .quote{border-left:3px solid var(--line);padding:8px 0 8px 16px;margin:12px 0;
         font-style:italic;color:#3a4853;font-size:14px;line-height:1.45}
  .rowstats{display:flex;gap:20px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px dashed var(--line)}
  .rowstats div{font-size:12px;color:var(--muted);min-width:90px}
  .rowstats b{display:block;font-size:17px;color:var(--ink);font-weight:700;margin-bottom:2px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin:8px 0 20px}
  th,td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:700}
  td b{color:var(--ink)}
  .foot{padding:20px 40px 30px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
  .foot b{color:var(--ink)}
  .foot p{margin-bottom:8px;line-height:1.5}
  .vod-link{color:var(--accent);font-weight:600;text-decoration:none}
  .vod-link:hover{text-decoration:underline}
  .stamp{margin:16px 0 8px;padding:14px 16px;background:var(--accent-soft);border-radius:10px;
         font-size:13px;color:#1e3a8a;line-height:1.5}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;max-width:100%}.card{break-inside:avoid}}
  @page{margin:14mm}
`;

function pntCard(p: PntRow, featured: boolean): string {
  const conc = p.conc_at ? num(p.conc_at) : "—";
  const ts = fmtHMS(p.t_seconds || 0);
  const vod = vodUrl(p.video_id, p.t_seconds || 0);
  const fmt = prominenceLabel(p.tier, p.tier_label);
  const vodA = `<a class="vod-link" href="${esc(vod)}" target="_blank" rel="noreferrer">YouTube ${ts} ↗</a>`;

  return `<div class="card">
    ${featured ? `<span class="tag">Pauta verificada · ${esc(fmt)}</span>` : ""}
    <div style="font-size:17px;font-weight:600;margin-bottom:4px">${esc(p.brand_name)}</div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:12px">${ts}${p.precise === false ? " (aprox.)" : ""} · ${vodA}</div>
    <div class="quote">"${esc(p.quote || "")}"</div>
    <div class="rowstats">
      <div><b>${conc}</b>mirando en ese minuto</div>
      <div><b>${usdEst(p.value_usd)}</b>exposición estimada</div>
      <div><b>${esc(fmt)}</b>formato de lectura</div>
      <div><b>${esc(p.sentiment || "neutro")}</b>tono detectado</div>
    </div>
  </div>`;
}

/** Certificado de una PNT puntual (marca + programa). */
export function buildPntCertificateHTML(p: PntRow, program: Program): string {
  const today = new Date().toLocaleDateString("es-AR");
  const conc = p.conc_at ? num(p.conc_at) : "—";
  const peak = program.peak ? num(program.peak) : "—";
  const vod = vodUrl(p.video_id, p.t_seconds || 0);
  const ts = fmtHMS(p.t_seconds || 0);
  const fmt = prominenceLabel(p.tier, p.tier_label);

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Certificado — ${esc(p.brand_name)} · ${esc(program.channel_name)}</title>
<style>${CERT_CSS}</style></head><body>
<div class="page">
  <div class="head">
    <div class="kicker">Certificado de emisión · Pauta verificada · Eco</div>
    <h1>${esc(p.brand_name)}</h1>
    <div class="sub">Prueba de entrega: lectura de pauta al aire con audiencia medida al minuto.</div>
    <div class="meta">
      <span><b>Canal:</b> ${esc(program.channel_name)}</span>
      <span><b>Programa:</b> ${esc(programTitle(program))}</span>
      <span><b>Emisión:</b> ${esc(program.date)}</span>
      <span><b>Verificación:</b> <a class="vod-link" href="${esc(vod)}">YouTube ${ts} ↗</a></span>
    </div>
  </div>

  <div class="hero">
    <div class="hero-grid">
      <div class="stat"><div class="n">${conc}</div><div class="l">espectadores en vivo en el minuto de la lectura</div></div>
      <div class="stat"><div class="n">${peak !== "—" ? peak : conc}</div><div class="l">${peak !== "—" ? "pico concurrentes del programa" : "audiencia en el minuto"}</div></div>
      <div class="stat"><div class="n">${usdEst(p.value_usd)}</div><div class="l">exposición estimada (benchmark CPM)</div></div>
    </div>
  </div>

  <div class="body">
    <p class="lead">Este certificado acredita que <b>${esc(p.brand_name)}</b> fue leída al aire en <b>${esc(program.channel_name)}</b> el ${esc(program.date)}, con <b>${conc}</b> personas mirando en vivo en el minuto exacto. Formato: <b>${esc(fmt)}</b>.</p>
    <div class="stamp">✓ Pauta verificada con cita textual contrastada contra la transcripción del programa. Medición independiente — no es factura ni comprobante de pago.</div>
    ${pntCard(p, true)}
  </div>

  <div class="foot">
    <p><b>Uso comercial.</b> Documento para el equipo comercial del canal: demostrar entrega de pauta a anunciantes con prueba verificable (minuto, cita, concurrentes).</p>
    <p>Generado por Eco · ${today} · Inteligencia de emisión en streaming argentino en vivo.</p>
  </div>
</div>
</body></html>`;
}

/** Certificado del programa completo (todas las PNT del vivo). */
export function buildProgramCertificateHTML(program: Program): string {
  const today = new Date().toLocaleDateString("es-AR");
  const peak = program.peak ? num(program.peak) : "—";
  const avg = program.avg ? num(program.avg) : "—";
  const views = program.views ? num(program.views) : "—";
  const dur = program.dur_min ? `${program.dur_min} min` : "—";
  const vod = `https://www.youtube.com/watch?v=${program.video_id}`;
  const totalExp = program.pnt.reduce((a, p) => a + (p.value_usd || 0), 0);

  const tableRows = program.pnt
    .map(
      (p) => `<tr>
      <td><b>${esc(p.brand_name)}</b></td>
      <td>${fmtHMS(p.t_seconds || 0)}</td>
      <td>${p.conc_at ? num(p.conc_at) : "—"}</td>
      <td>${esc(prominenceLabel(p.tier, p.tier_label))}</td>
      <td>${usdEst(p.value_usd)}</td>
    </tr>`
    )
    .join("");

  const cards = program.pnt.map((p) => pntCard(p, false)).join("");

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Certificado programa · ${esc(program.channel_name)}</title>
<style>${CERT_CSS}</style></head><body>
<div class="page">
  <div class="head">
    <div class="kicker">Certificado de emisión · Programa completo · Eco</div>
    <h1>${esc(program.channel_name)}</h1>
    <div class="sub">${esc(programTitle(program))}</div>
    <div class="meta">
      <span><b>Fecha:</b> ${esc(program.date)}</span>
      <span><b>Duración:</b> ${dur}</span>
      <span><b>Reproducciones VOD:</b> ${views}</span>
      <span><b>Apariciones verificadas:</b> ${program.pnt_count}</span>
      <span><b>VOD:</b> <a class="vod-link" href="${esc(vod)}">YouTube ↗</a></span>
    </div>
  </div>

  <div class="hero">
    <div class="hero-grid">
      <div class="stat"><div class="n">${peak}</div><div class="l">pico de concurrentes</div></div>
      <div class="stat"><div class="n">${avg}</div><div class="l">promedio concurrentes</div></div>
      <div class="stat"><div class="n">${program.pnt_count}</div><div class="l">lecturas de pauta verificadas</div></div>
      <div class="stat"><div class="n">${usdEst(totalExp)}</div><div class="l">exposición total estimada de pauta</div></div>
    </div>
  </div>

  <div class="body">
    <p class="lead">Resumen de <b>${program.pnt_count}</b> lecturas de pauta verificadas en este programa, con audiencia medida minuto a minuto y cita textual de cada aparición.</p>

    <div class="section-label">Tabla de entregas</div>
    <table>
      <thead><tr><th>Marca</th><th>Minuto</th><th>Concurrentes</th><th>Formato</th><th>Exposición est.</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>

    <div class="section-label">Detalle con cita (${program.pnt_count})</div>
    ${cards}
  </div>

  <div class="foot">
    <p><b>Verificación.</b> Solo apariciones con cita en el programa. Los USD son benchmark de exposición (CPM ref.), no facturación.</p>
    <p>Generado por Eco · ${today}.</p>
  </div>
</div>
</body></html>`;
}

export function printCertificate(html: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
}
