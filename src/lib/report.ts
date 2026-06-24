// Genera el reporte de marca como HTML branded para imprimir / guardar como PDF.
// Se abre en una ventana nueva y se dispara window.print() -> "Guardar como PDF".

const usd = (n: number) => "US$ " + Math.round(n || 0).toLocaleString("es-AR");
const num = (n: number) => (n ?? 0).toLocaleString("es-AR");
const compact = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n ?? 0);
};
const esc = (s: string) =>
  (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function bars(series: any[]): string {
  if (!series || !series.length) return "";
  const maxV = Math.max(...series.map((s) => s.value_usd), 1);
  const W = 700, H = 140, pad = 6;
  const bw = (W - pad * 2) / series.length;
  const rects = series
    .map((s, i) => {
      const h = ((H - 24) * s.value_usd) / maxV;
      const x = pad + i * bw;
      return `<rect x="${(x + bw * 0.18).toFixed(1)}" y="${(H - 18 - h).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" rx="2" fill="#2f5fe0" />`;
    })
    .join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="140">${rects}</svg>`;
}

function seg(parts: { label: string; value: number; color: string }[]): string {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const segs = parts
    .map((p) => `<span style="display:inline-block;height:10px;width:${((p.value / total) * 100).toFixed(1)}%;background:${p.color}"></span>`)
    .join("");
  const legend = parts
    .map((p) => `<span style="margin-right:14px;font-size:11px;color:#555"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>${p.label} ${p.value}</span>`)
    .join("");
  return `<div style="display:flex;border-radius:6px;overflow:hidden;background:#eee">${segs}</div><div style="margin-top:6px">${legend}</div>`;
}

export function buildReportHTML(
  r: any,
  ctx: { reach: number; programs: number; topChannel: string; chName: Record<string, string> }
): string {
  const tier = r.by_tier || {};
  const sent = r.by_sentiment || {};
  const best = r.best;
  const today = new Date().toLocaleDateString("es-AR");

  const rows = (r.detail || [])
    .map(
      (d: any) => `
    <tr>
      <td>${esc(d.date)}</td>
      <td>${esc(ctx.chName[d.channel] || d.channel_name || "")}</td>
      <td><i>${esc(d.quote || d.title || "")}</i><br><span class="muted">${esc((d.title || "").slice(0, 60))} · ${esc(d.minute)}</span></td>
      <td>${esc(d.tier_label || "")}</td>
      <td>${esc(d.sentiment || "")}</td>
      <td class="r">${compact(d.views)}</td>
      <td class="r">${usd(d.value_usd)}</td>
    </tr>`
    )
    .join("");

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Eco · Reporte ${esc(r.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#1a1a1a; margin:0; padding:40px 44px; }
  .brand { font-size:13px; font-weight:600; letter-spacing:-.2px; }
  .brand span { color:#888; font-weight:400; }
  h1 { font-size:25px; margin:6px 0 2px; }
  .sub { color:#666; font-size:13px; margin-bottom:22px; }
  .kpis { display:flex; gap:12px; margin:18px 0 24px; }
  .kpi { flex:1; border:1px solid #ececec; border-radius:10px; padding:12px 14px; }
  .kpi .l { font-size:10px; text-transform:uppercase; letter-spacing:.4px; color:#999; }
  .kpi .v { font-size:20px; font-weight:600; margin-top:3px; }
  .exec { background:#f7f9ff; border:1px solid #e6ecfb; border-radius:10px; padding:16px 18px; font-size:13.5px; line-height:1.6; color:#333; }
  .grid2 { display:flex; gap:20px; margin:22px 0; }
  .box { flex:1; border:1px solid #ececec; border-radius:10px; padding:16px; }
  h2 { font-size:14px; margin:0 0 12px; }
  h3 { font-size:12px; margin:0 0 8px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  th { text-align:left; font-size:10px; color:#999; text-transform:uppercase; letter-spacing:.3px; padding:8px 8px; border-bottom:1px solid #ececec; }
  td { font-size:11.5px; padding:8px 8px; border-bottom:1px solid #f3f3f3; vertical-align:top; }
  td.r, th.r { text-align:right; white-space:nowrap; }
  .muted { color:#aaa; font-size:10px; }
  .foot { color:#999; font-size:10px; margin-top:18px; line-height:1.5; }
  @media print { body { padding:24px 28px; } @page { margin:14mm; } }
</style></head><body>
  <div class="brand">Eco <span>· el eco de tu marca en el streaming AR</span></div>
  <h1>${esc(r.name)}</h1>
  <div class="sub">Reporte de brand intelligence · streaming argentino en vivo · ${today}</div>

  <div class="exec">
    <b>${esc(r.name)}</b> registró <b>${num(r.mentions)}</b> menciones en <b>${ctx.programs}</b> programas
    a lo largo de <b>${(r.channels || []).length}</b> streams, con <b>${compact(ctx.reach)}</b> views acumuladas
    y un valor de referencia de <b>${usd(r.value_usd)}</b> (lente CPM).
    ${best ? `El pico fue en <b>${esc(best.channel_name)}</b> el ${esc(best.date)} (${usd(best.value_usd)}). Mayor presencia en <b>${esc(ctx.topChannel)}</b>.` : ""}
  </div>

  <div class="kpis">
    <div class="kpi"><div class="l">Menciones</div><div class="v">${num(r.mentions)}</div></div>
    <div class="kpi"><div class="l">Streams</div><div class="v">${(r.channels || []).length}</div></div>
    <div class="kpi"><div class="l">Alcance VOD</div><div class="v">${compact(ctx.reach)}</div></div>
    <div class="kpi"><div class="l">Valor referencia</div><div class="v">${usd(r.value_usd)}</div></div>
  </div>

  <div class="grid2">
    <div class="box"><h2>Evolución temporal</h2>${bars(r.series)}<div class="muted">Valor de referencia por día (USD).</div></div>
  </div>

  <div class="grid2">
    <div class="box"><h3>Prominencia (tier)</h3>${seg([
      { label: "Pauta / PNT", value: tier["1"] || 0, color: "#2f5fe0" },
      { label: "Orgánica", value: tier["2"] || 0, color: "#22a06b" },
      { label: "Aproximada", value: tier["3"] || 0, color: "#cbd2dd" },
    ])}</div>
    <div class="box"><h3>Sentimiento</h3>${seg([
      { label: "Positivo", value: sent.positivo || 0, color: "#22a06b" },
      { label: "Neutro", value: sent.neutro || 0, color: "#cbd2dd" },
      { label: "Negativo", value: sent.negativo || 0, color: "#e2574c" },
    ])}</div>
  </div>

  <h2>Detalle con prueba textual</h2>
  <table>
    <thead><tr><th>Fecha</th><th>Canal</th><th>Prueba textual</th><th>Tier</th><th>Sent.</th><th class="r">Views</th><th class="r">Valor</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="foot">
    Valor de referencia = lente CPM (audiencia × CPM × peso de prominencia), según MODELO-VALORIZACION.
    Es un benchmark de exposición earned-media, no facturación. Tier y sentimiento se infieren del contexto hablado alrededor de la mención.
    Generado por Eco · ${today}.
  </div>
</body></html>`;
}
