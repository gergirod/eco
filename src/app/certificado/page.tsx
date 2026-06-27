"use client";
import { useState, useMemo, useEffect } from "react";
import { PageHeader, Stat, Badge } from "@/components/ui";
import { num, compact, fmtHMS } from "@/lib/format";
import { usdEst } from "@/lib/valuation";
import { prominenceLabel } from "@/lib/prominence";
import { useCorpus } from "@/lib/useCorpus";
import { buildProgramsIndex, type Program } from "@/lib/programs";
import {
  buildPntCertificateHTML,
  buildProgramCertificateHTML,
  printCertificate,
} from "@/lib/certificate";

function tsLink(videoId: string, seconds: number) {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(0, seconds | 0)}s`;
}

export default function CertificadoPage() {
  const { reports, moments, channels } = useCorpus(["reports", "moments", "channels"] as const);

  const programs = useMemo(
    () => buildProgramsIndex(reports, moments),
    [reports, moments]
  );

  const channelIds = useMemo(() => {
    const ids = new Set(programs.map((p) => p.channel));
    return channels
      .filter((c) => ids.has(c.id))
      .map((c) => c.id)
      .sort();
  }, [programs, channels]);

  const [channel, setChannel] = useState("olga");
  const [videoId, setVideoId] = useState("");

  const channelPrograms = useMemo(
    () => programs.filter((p) => p.channel === channel),
    [programs, channel]
  );

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const ch = q.get("channel");
    const vid = q.get("video");
    if (ch && channelIds.includes(ch)) setChannel(ch);
    if (vid && programs.some((p) => p.video_id === vid)) setVideoId(vid);
  }, [channelIds, programs]);

  useEffect(() => {
    if (!channelPrograms.length) {
      setVideoId("");
      return;
    }
    if (!channelPrograms.some((p) => p.video_id === videoId)) {
      setVideoId(channelPrograms[0].video_id);
    }
  }, [channelPrograms, videoId]);

  const program: Program | undefined = channelPrograms.find((p) => p.video_id === videoId);

  function downloadPnt(p: Program["pnt"][0]) {
    if (!program) return;
    printCertificate(buildPntCertificateHTML(p, program));
  }

  function downloadProgram() {
    if (!program) return;
    printCertificate(buildProgramCertificateHTML(program));
  }

  return (
    <div>
      <PageHeader
        title="Certificados de emisión"
        sub="Prueba de entrega de pauta para el comercial del stream — minuto, cita, atención medida y PDF listo para mandar al anunciante."
      />

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {channelIds.map((id) => {
          const name = channels.find((c) => c.id === id)?.name || id;
          const n = programs.filter((p) => p.channel === id).length;
          return (
            <button
              key={id}
              onClick={() => setChannel(id)}
              className={`px-3 py-1.5 rounded-lg text-[13px] border transition ${
                channel === id
                  ? "bg-accent-soft border-accent text-accent font-medium"
                  : "bg-white border-[#ececec] text-gray-600 hover:bg-gray-50"
              }`}
            >
              {name}
              <span className="text-[11px] opacity-60 ml-1">({n})</span>
            </button>
          );
        })}
        {program && (
          <button className="btn btn-primary ml-auto" onClick={downloadProgram}>
            ↓ PDF programa completo
          </button>
        )}
      </div>

      {!channelPrograms.length ? (
        <div className="card p-6 text-[13px] text-gray-500">
          Sin programas con pauta verificada en este canal todavía.
        </div>
      ) : (
        <div className="grid grid-cols-[320px_1fr] gap-5">
          <div className="card p-3 max-h-[70vh] overflow-y-auto">
            <div className="text-[11px] uppercase tracking-wide text-gray-400 px-2 py-1 mb-1">
              Programas ({channelPrograms.length})
            </div>
            {channelPrograms.map((p) => {
              const active = p.video_id === videoId;
              return (
                <button
                  key={p.video_id}
                  onClick={() => setVideoId(p.video_id)}
                  className={`w-full text-left px-2.5 py-2.5 rounded-lg mb-0.5 transition ${
                    active ? "bg-accent-soft text-accent" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="text-[12px] font-medium leading-snug line-clamp-2">
                    {(p.title || p.video_id).slice(0, 72)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 flex gap-2">
                    <span>{p.date}</span>
                    <span>{p.pnt_count} apariciones</span>
                    {p.peak ? <span>{compact(p.peak)} pico</span> : null}
                  </div>
                </button>
              );
            })}
          </div>

          {program && (
            <div>
              <div className="card p-5 mb-4" style={{ background: "linear-gradient(180deg,#f7f9ff,#ffffff)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[17px] font-semibold leading-snug">{program.title || program.video_id}</h2>
                    <div className="text-[13px] text-gray-500 mt-1">
                      {program.channel_name} · {program.date}
                      {program.dur_min ? ` · ${program.dur_min} min` : ""}
                    </div>
                  </div>
                  <Badge tone="blue">{program.pnt_count} apariciones</Badge>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-5">
                <Stat
                  label="Pico de atención"
                  value={program.peak ? compact(program.peak) : "—"}
                  hint="concurrentes"
                />
                <Stat
                  label="Promedio"
                  value={program.avg ? compact(program.avg) : "—"}
                  hint="atención medida"
                />
                <Stat label="Reproducciones VOD" value={program.views ? compact(program.views) : "—"} hint="acumuladas" />
                <Stat
                  label="Exposición de pauta"
                  value={usdEst(program.pnt.reduce((a, p) => a + (p.value_usd || 0), 0))}
                  hint="benchmark, no factura"
                />
              </div>

              <div className="card overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#ececec] text-left text-[11px] uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-3 font-medium">Marca</th>
                      <th className="px-4 py-3 font-medium">Minuto</th>
                      <th className="px-4 py-3 font-medium">Atención</th>
                      <th className="px-4 py-3 font-medium">Formato</th>
                      <th className="px-4 py-3 font-medium">Exposición</th>
                      <th className="px-4 py-3 font-medium w-36"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {program.pnt.map((p, i) => (
                      <tr key={i} className="border-b border-[#f3f3f3] hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-medium">{p.brand_name}</td>
                        <td className="px-4 py-3">
                          <a
                            href={tsLink(p.video_id, p.t_seconds)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline tabular-nums"
                          >
                            {fmtHMS(p.t_seconds)}
                          </a>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{p.conc_at ? num(p.conc_at) : "—"}</td>
                        <td className="px-4 py-3">{prominenceLabel(p.tier, p.tier_label)}</td>
                        <td className="px-4 py-3 tabular-nums">{usdEst(p.value_usd)}</td>
                        <td className="px-4 py-3">
                          <button
                            className="text-[12px] text-accent font-medium hover:underline"
                            onClick={() => downloadPnt(p)}
                          >
                            ↓ Certificado
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[820px]">
                Cada certificado es un one-pager para el comercial del canal: prueba que la marca salió al aire,
                con cita verificada y audiencia del minuto. Sin inversión declarada ni auditoría de precio — eso
                es el reporte de marca (<a href="/marca" className="text-accent">/marca</a>).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
