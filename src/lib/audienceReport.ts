/**
 * Informe PDF de sala / demanda en vivo — por emisión (agencia).
 */

import { demandTipoLabel } from "@/lib/audienceDemand";
import type { RoomParticipation } from "@/lib/roomReaction";

const esc = (s: string) =>
  (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const num = (n: number) => Math.round(n ?? 0).toLocaleString("es-AR");

type DemandRow = {
  tema: string;
  evidencia: string;
  minute?: string;
  tipo?: string;
};

type ConductorMoment = {
  kind?: string;
  minute?: number;
  quote?: string;
  response?: {
    label?: string;
    ratio?: number;
    pre_rpm?: number;
    post_rpm?: number;
  };
};

type AudienceReportInput = {
  video_id: string;
  title: string;
  channel_name: string;
  date?: string;
  chat_total?: number;
  peak?: number;
  avg?: number;
  audience_demand?: DemandRow[];
  room_participation?: RoomParticipation | null;
  conductor_response?: {
    summary_line?: string | null;
    avg_ratio?: number | null;
    moments?: ConductorMoment[];
  } | null;
};

export function buildAudienceReportHTML(input: AudienceReportInput): string {
  const demand = input.audience_demand || [];
  const room = input.room_participation;
  const conductor = input.conductor_response;
  const strongMoments = (conductor?.moments || []).filter(
    (m) => (m.response?.ratio ?? 0) >= 1.12
  );

  const demandHtml = demand.length
    ? demand
        .map(
          (d) => `
        <li style="margin-bottom:14px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#0f7d6b;font-weight:700">
            ${esc(demandTipoLabel(d.tipo))}${d.minute ? ` · min ${esc(d.minute)}` : ""}
          </div>
          <div style="font-size:15px;font-weight:600;margin:4px 0">${esc(d.tema)}</div>
          <div style="font-size:14px;color:#3a4853;font-style:italic">"${esc(d.evidencia)}"</div>
        </li>`
        )
        .join("")
    : `<p style="color:#5b6b78">Sin pedidos claros detectados en el chat de esta emisión.</p>`;

  const conductorHtml = strongMoments.length
    ? strongMoments
        .slice(0, 6)
        .map(
          (m) => `
        <li style="margin-bottom:12px;font-size:14px;color:#26433c">
          <b>Min ${m.minute ?? "—"}</b> · ${esc(m.response?.label || "Respuesta en chat")}
          ${m.response?.ratio ? ` (${m.response.ratio}× más activo que antes)` : ""}
          <div style="font-size:13px;color:#5b6b78;margin-top:4px;font-style:italic">Conductor: "${esc(m.quote || "")}"</div>
        </li>`
        )
        .join("")
    : conductor?.summary_line
      ? `<p style="color:#26433c">${esc(conductor.summary_line)}</p>`
      : `<p style="color:#5b6b78">Sin pedidos del conductor medibles con chat en esta emisión.</p>`;

  const roomLine = room?.summary_line
    ? `<p style="margin-top:8px"><b>Participación:</b> ${esc(room.summary_line)}</p>`
    : "";

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Sala en vivo — ${esc(input.title)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#15212b;background:#f3f5f7;padding:32px 16px;line-height:1.5}
  .page{max-width:720px;margin:0 auto;background:#fff;border-radius:14px;box-shadow:0 4px 24px rgba(20,33,43,.08);overflow:hidden}
  .head{padding:32px 36px 24px;border-bottom:1px solid #e4e9ee}
  h1{font-size:26px;margin:8px 0 6px}
  .sub{color:#5b6b78;font-size:14px}
  .hero{padding:24px 36px;background:#fbfdfc;border-bottom:1px solid #e4e9ee;display:flex;gap:12px;flex-wrap:wrap}
  .stat{flex:1;min-width:140px;border:1px solid #e4e9ee;border-radius:10px;padding:14px 16px}
  .stat .n{font-size:26px;font-weight:700}
  .stat .l{font-size:12px;color:#5b6b78}
  .body{padding:24px 36px 32px}
  h2{font-size:16px;margin:24px 0 10px;color:#0f7d6b}
  h2:first-child{margin-top:0}
  ul{padding-left:0;list-style:none}
  .foot{padding:20px 36px;border-top:1px solid #e4e9ee;font-size:12px;color:#5b6b78}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none}}
</style></head><body><div class="page">
  <div class="head">
    <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b6b78;font-weight:600">Demanda en vivo · Chat</div>
    <h1>${esc(input.title)}</h1>
    <div class="sub">${esc(input.channel_name)}${input.date ? ` · ${esc(input.date)}` : ""}</div>
  </div>
  <div class="hero">
    ${input.chat_total ? `<div class="stat"><div class="n">${num(input.chat_total)}</div><div class="l">mensajes en chat capturados</div></div>` : ""}
    ${input.peak ? `<div class="stat"><div class="n">${num(input.peak)}</div><div class="l">pico de atención (concurrentes)</div></div>` : ""}
    ${room?.paid_events ? `<div class="stat"><div class="n">${room.paid_events}</div><div class="l">apoyos económicos en chat</div></div>` : ""}
  </div>
  <div class="body">
    <h2>Qué pidió la gente</h2>
    <p style="font-size:14px;color:#5b6b78;margin-bottom:16px">Señales de demanda en el chat — lo que la audiencia pidió o repitió en vivo. No es pauta ni intención de compra verificada.</p>
    <ul>${demandHtml}</ul>
    ${roomLine}
    <h2>¿La sala le hace caso al conductor?</h2>
    <p style="font-size:14px;color:#5b6b78;margin-bottom:12px">Comparamos cuánto hablaba el chat antes y después de pedidos detectados en el audio (likes, votos, códigos).</p>
    <ul>${conductorHtml}</ul>
  </div>
  <div class="foot">
    <p><b>Cómo lo medimos.</b> Pedidos sacados del chat capturado; respuesta al conductor = más mensajes en los minutos después del pedido, comparado con antes. No incluye el botón 👍 de YouTube. Es una referencia de participación, no de ventas.</p>
    <p>Eco · Inteligencia de atención en streaming argentino en vivo.</p>
  </div>
</div></body></html>`;
}

export function openAudienceReport(input: AudienceReportInput) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(buildAudienceReportHTML(input));
  w.document.close();
  setTimeout(() => w.print(), 400);
}
