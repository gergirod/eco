// Informe de entrega — PDF vía window.print (copy SPEC-005).

import {
  EVIDENCE_LABEL,
  EVIDENCE_ORDER,
  formatScopePeriod,
  evidenceLabel,
} from "@/lib/campaign";
import { prominenceLabel } from "@/lib/prominence";
import {
  REPORT_CSS,
  compact,
  esc,
  fmtHMS,
  num,
  programLabel,
  vodUrl,
} from "@/lib/report";

const CAMPAIGN_REPORT_CSS = `
${REPORT_CSS}
  :root{--campaign:#0f7d6b;--campaign-soft:#e8f5f1}
  .campaign-doc .head{border-top:4px solid var(--campaign)}
  .campaign-doc .kicker{color:var(--campaign)}
  .pdf-page{padding:34px 40px 28px}
  .pdf-page + .pdf-page{border-top:1px solid var(--line)}
  .pdf-page.break{page-break-before:always}
  .conclusion{background:var(--campaign-soft);border:1px solid #cfe9e2;border-radius:12px;
              padding:20px 22px;margin-top:22px}
  .conclusion h4{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--campaign);margin-bottom:8px}
  .conclusion p{font-size:15px;color:#26433c;line-height:1.55}
  .evidence-grid{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0 8px}
  .evidence-pill{flex:1;min-width:120px;border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:#fff}
  .evidence-pill .n{font-size:22px;font-weight:700;color:var(--ink)}
  .evidence-pill .l{font-size:11px;color:var(--muted);margin-top:2px}
  .tag.evidence-verified{background:#e8f5f1;color:#0f7d6b}
  .tag.evidence-partial{background:#f7efdc;color:#b8862b}
  .tag.evidence-insufficient{background:#fce8e4;color:#c45c4a}
  .timeline-item{border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:14px}
  .timeline-item .when{font-size:13px;color:var(--muted);margin:6px 0 10px}
  .timeline-meta{display:flex;flex-wrap:wrap;gap:16px;margin-top:12px;padding-top:12px;border-top:1px dashed var(--line);
                 font-size:12px;color:var(--muted)}
  .timeline-meta b{display:block;font-size:15px;color:var(--ink);font-weight:700;margin-bottom:2px}
  .method-page .method-row b{flex:0 0 140px}
  @media print{
    .pdf-page.break{page-break-before:always}
    .timeline-item{break-inside:avoid}
  }
`;

function evidenceTagClass(level: string | undefined): string {
  if (level === "VERIFIED") return "evidence-verified";
  if (level === "PARTIAL_EVIDENCE") return "evidence-partial";
  if (level === "INSUFFICIENT_EVIDENCE") return "evidence-insufficient";
  return "paid";
}

function campaignTitle(report: any): string {
  const scope = report.scope || {};
  const brand = scope.marca || report.name || "Campaña";
  const period = scope.desde ? formatScopePeriod(scope.desde, scope.hasta) : "";
  return period ? `${brand} · ${period}` : brand;
}

function executiveConclusion(report: any, chName: Record<string, string>): string {
  const total = report.mentions ?? report.detail?.length ?? 0;
  if (!total) {
    return "En el período analizado no se registraron apariciones de pauta verificables para esta marca en los canales incluidos.";
  }

  const by = report.summary?.by_evidence || {};
  const verified = by.VERIFIED || 0;
  const partial = by.PARTIAL_EVIDENCE || 0;
  const insufficient = by.INSUFFICIENT_EVIDENCE || 0;
  const best = report.best;
  const bestConc = best?.conc_at ? compact(best.conc_at) : null;
  const bestCh = best ? chName[best.channel] || best.channel_name || best.channel : "";
  const bestProg = best ? programLabel(best) : "";

  if (verified === total) {
    return (
      `Se detectaron ${total} apariciones de pauta en el período acordado. Todas cuentan con respaldo completo: ` +
      `cita verificable en el programa y, cuando hubo captura en vivo, medición de audiencia al instante.` +
      (bestConc
        ? ` El momento de mayor atención reunió ${bestConc} personas mirando en ${esc(bestCh)} (${esc(bestProg)}).`
        : "")
    );
  }

  let base =
    `Se detectaron ${total} apariciones de pauta. ${verified} con respaldo completo`;
  if (partial) base += `, ${partial} con respaldo parcial`;
  if (insufficient) base += `, ${insufficient} con respaldo insuficiente`;
  base += ".";
  if (bestConc) {
    base += ` La mayor audiencia medida fue ${bestConc} personas en ${esc(bestCh)}.`;
  }
  base += " Este informe describe respaldo disponible — no afirma cumplimiento contractual.";
  return base;
}

function evidenceSummaryHtml(report: any): string {
  const total = report.mentions ?? report.detail?.length ?? 0;
  const by = report.summary?.by_evidence || {};
  return `<div class="evidence-grid">
    ${EVIDENCE_ORDER.map((level) => {
      const count = by[level] || 0;
      return `<div class="evidence-pill">
        <div class="n">${num(count)}</div>
        <div class="l">${esc(EVIDENCE_LABEL[level])}</div>
      </div>`;
    }).join("")}
    <div class="evidence-pill">
      <div class="n">${num(total)}</div>
      <div class="l">Apariciones totales</div>
    </div>
  </div>`;
}

function activationTimelineCard(d: any, chName: Record<string, string>): string {
  const canal = esc(chName[d.channel] || d.channel_name || d.channel || "");
  const ts = fmtHMS(d.t_seconds || 0);
  const vod = d.video_id ? vodUrl(d.video_id, d.t_seconds || 0) : "";
  const vodLink = vod
    ? `<a class="vod-link" href="${esc(vod)}">${esc(vod)}</a>`
    : "—";
  const conc = d.conc_at ? num(d.conc_at) : "No disponible";
  const evLevel = d.evidence || "";
  const evLabel = evidenceLabel(evLevel);
  const evReason = d.evidence_reason ? `<div style="font-size:12px;color:#5b6b78;margin-top:6px">${esc(d.evidence_reason)}</div>` : "";

  return `<div class="timeline-item">
    <span class="tag ${evidenceTagClass(evLevel)}">${esc(evLabel)}</span>
    <h3>${esc(programLabel(d))}</h3>
    <div class="when">${esc(d.date)} · ${canal} · minuto ${ts}</div>
    <div class="quote">"${esc(d.quote || "")}"</div>
    ${evReason}
    <div class="timeline-meta">
      <div><b>${conc}</b>personas mirando en vivo</div>
      <div><b>${esc(prominenceLabel(d.tier, d.tier_label))}</b>formato de la lectura</div>
      <div><b>Ver en video</b>${vodLink}</div>
    </div>
  </div>`;
}

function methodologyPage(): string {
  return `<section class="pdf-page break method-page">
    <div class="section-label">Metodología</div>
    <h2 style="font-size:22px;margin-bottom:16px">Cómo leer este informe</h2>
    <div class="method-box" style="background:#f7faf9;border-color:#dceee9;border-left-color:var(--campaign)">
      <div class="method-row"><b>Origen de los datos</b><span>Transcripción del audio del programa en vivo y captura de audiencia concurrente minuto a minuto, cuando el canal estaba al aire en el período analizado.</span></div>
      <div class="method-row"><b>Qué es el respaldo</b><span>Indica cuánta prueba verificable existe por aparición: cita en el programa, segundo exacto de la lectura y personas mirando en ese instante. No evaluamos video, logos, códigos QR ni cumplimiento del plan de medios.</span></div>
      <div class="method-row"><b>Respaldo completo</b><span>Cita verificable + minuto preciso + audiencia concurrente capturada.</span></div>
      <div class="method-row"><b>Respaldo parcial</b><span>Cita verificable, pero sin minuto preciso o sin dato de audiencia al instante.</span></div>
      <div class="method-row"><b>Limitaciones</b><span>Si no hubo captura en el día de emisión, la audiencia al instante puede no estar disponible. Este informe no sustituye el reporte del canal ni certifica entrega contractual.</span></div>
    </div>
    <p style="font-size:13px;color:var(--muted);margin-top:20px;line-height:1.5">
      Generado de forma independiente por Eco · Inteligencia de atención en streaming en vivo.
    </p>
  </section>`;
}

export function buildCampaignReportHTML(
  report: any,
  ctx: { chName: Record<string, string> }
): string {
  const scope = report.scope || {};
  const brand = scope.marca || report.name || "—";
  const period = scope.desde ? formatScopePeriod(scope.desde, scope.hasta) : "—";
  const channelsLabel = (scope.canales || report.channels || [])
    .map((c: string) => ctx.chName[c] || c)
    .join(" · ");
  const total = report.mentions ?? report.detail?.length ?? 0;
  const today = new Date().toLocaleDateString("es-AR");
  const title = campaignTitle(report);

  const sorted = [...(report.detail || [])].sort((a, b) => {
    const da = a.date_iso || "";
    const db = b.date_iso || "";
    if (da !== db) return da.localeCompare(db);
    return (a.t_seconds || 0) - (b.t_seconds || 0);
  });

  const timelineHtml = sorted.map((d) => activationTimelineCard(d, ctx.chName)).join("");

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Informe de entrega</title>
<style>${CAMPAIGN_REPORT_CSS}</style></head><body>
<div class="page campaign-doc">

  <section class="pdf-page head">
    <div class="kicker">Informe de entrega · Campaña</div>
    <h1>${esc(title)}</h1>
    <div class="sub">Pauta verificada en streaming en vivo — período y canales de la compra.</div>
    <div class="meta">
      <span><b>Marca:</b> ${esc(brand)}</span>
      <span><b>Período:</b> ${esc(period)}</span>
      <span><b>Canales:</b> ${esc(channelsLabel || "—")}</span>
      <span><b>Emisión del informe:</b> ${esc(today)}</span>
    </div>
  </section>

  <section class="pdf-page">
    <div class="section-label">Resumen ejecutivo</div>
    <div class="hero" style="border-bottom:none;padding-left:0;padding-right:0">
      <div class="hero-grid">
        <div class="stat paid"><div class="n">${num(total)}</div><div class="l">apariciones en el período</div></div>
        <div class="stat"><div class="n">${esc(period)}</div><div class="l">período analizado</div></div>
        <div class="stat"><div class="n">${(scope.canales || report.channels || []).length}</div><div class="l">canales incluidos</div></div>
      </div>
    </div>
    <div class="section-label" style="margin-top:8px">Resumen de respaldo</div>
    ${evidenceSummaryHtml(report)}
    <div class="conclusion">
      <h4>Conclusión ejecutiva</h4>
      <p>${executiveConclusion(report, ctx.chName)}</p>
    </div>
  </section>

  <section class="pdf-page break">
    <div class="section-label">Inventario de apariciones</div>
    <p class="lead" style="margin-bottom:18px">
      Cada bloque es una lectura de pauta verificada en el período acordado, en orden cronológico.
      El enlace abre el video en el segundo exacto de la cita.
    </p>
    ${timelineHtml || "<p>No hay apariciones en el período.</p>"}
  </section>

  ${methodologyPage()}

  <div class="foot">
    <p><b>Alcance.</b> Solo apariciones dentro del período acordado (${esc(period)}, ${esc(channelsLabel)}). Sin histórico de la marca fuera de este período.</p>
    <p>Eco · Informe de entrega · ${esc(today)}</p>
  </div>
</div>
</body></html>`;
}

export function printCampaignReportPDF(report: any, chName: Record<string, string>): void {
  const html = buildCampaignReportHTML(report, { chName });
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
}
