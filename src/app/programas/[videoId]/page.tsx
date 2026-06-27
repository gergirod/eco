"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ProgramTopicsPanel from "@/components/programs/ProgramTopicsPanel";
import AudienceDemandPanel from "@/components/programs/AudienceDemandPanel";
import RoomParticipationPanel from "@/components/programs/RoomParticipationPanel";
import MomentModal from "@/components/MomentModal";
import { Badge, Stat } from "@/components/ui";
import { evidenceLabel, evidenceTone } from "@/lib/campaign";
import { getProgram } from "@/lib/programs";
import { detectShowFormat } from "@/lib/showFormat";
import { getProgramTopics } from "@/lib/placement";
import { useDataset } from "@/lib/useDataset";
import programTopicsFb from "@/data/program_topics.json";
import { compact, fmtHMS, num, vodLink } from "@/lib/format";
import { usdEst } from "@/lib/valuation";
import { chatEcoLine, chatTableLine, chatToneClass, chatToneDot } from "@/lib/chatReaction";
import type { RoomParticipation } from "@/lib/roomReaction";
import reportsFb from "@/data/reports.json";
import channelsFb from "@/data/channels.json";
import momentsFb from "@/data/moments.json";

export default function ProgramaProfilePage() {
  const params = useParams();
  const videoId = typeof params.videoId === "string" ? params.videoId : "";

  const reports = useDataset("reports", reportsFb);
  const channels = useDataset<{ id: string; name: string }[]>("channels", channelsFb);
  const moments = useDataset<Record<string, Record<string, unknown>>>("moments", momentsFb);
  const programTopicsExport = useDataset("program_topics", programTopicsFb);
  const [openRow, setOpenRow] = useState<Record<string, unknown> | null>(null);

  const topics = useMemo(
    () => getProgramTopics(programTopicsExport as Parameters<typeof getProgramTopics>[0], videoId),
    [programTopicsExport, videoId]
  );

  const chName = useMemo(
    () => Object.fromEntries(channels.map((c) => [c.id, c.name])),
    [channels]
  );

  const program = useMemo(
    () =>
      getProgram(
        videoId,
        reports as Parameters<typeof getProgram>[1],
        moments as Parameters<typeof getProgram>[2]
      ),
    [videoId, reports, moments]
  );

  const moment = moments[videoId] || null;

  if (!program && !topics) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-[22px] font-semibold tracking-tight">Programa no encontrado</h1>
        <p className="text-[13.5px] text-gray-500 mt-2">
          Esta emisión no está en lo que tenemos hoy — sin marcas pautando ni temas de la charla.
        </p>
        <Link href="/canales" className="inline-block mt-5 text-[13px] text-accent font-medium hover:underline">
          ← Volver a canales
        </Link>
      </div>
    );
  }

  const headerTitle = program?.title || topics?.title || videoId;
  const headerChannel = program?.channel || topics?.channel_id || "";
  const headerChannelLabel = program?.channel_name || topics?.channel || headerChannel;
  const headerDate = program?.date || "";
  const show = detectShowFormat(headerChannel, headerTitle);
  const totalValue = program?.pnt.reduce((s, r) => s + (r.value_usd || 0), 0) ?? 0;
  const topBrand = program
    ? [...program.pnt].sort((a, b) => (b.conc_at || 0) - (a.conc_at || 0))[0]
    : undefined;

  return (
    <div className="max-w-4xl pb-10">
      <nav className="text-[13px] text-gray-500 mb-5 flex flex-wrap items-center gap-1.5">
        <Link href="/canales" className="hover:text-accent">
          Canales
        </Link>
        <span className="text-gray-300">/</span>
        <Link href={`/canales/${headerChannel}`} className="hover:text-accent">
          {chName[headerChannel] || headerChannelLabel}
        </Link>
        <span className="text-gray-300">/</span>
        <Link href={`/canales/${headerChannel}?tab=programas`} className="hover:text-accent">
          Programas
        </Link>
        <span className="text-gray-300">/</span>
        <Link
          href={`/canales/${headerChannel}?tab=programas&show=${show.id}`}
          className="hover:text-accent"
        >
          {show.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 line-clamp-1">Emisión</span>
      </nav>

      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-wide text-accent font-medium mb-1.5">
          Una emisión{headerDate ? ` · ${headerDate}` : ""}
        </p>
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-ink leading-snug">
          {headerTitle}
        </h1>
        <p className="text-[13px] text-gray-500 mt-2 max-w-2xl leading-relaxed">
          {program ? (
            <>
              Todo lo de abajo es de <b className="text-gray-700">este vivo</b> — minuto a minuto, marcas y
              atención de esa emisión ({show.name}
              {headerDate ? `, ${headerDate}` : ""}). Para el acumulado del show andá a{" "}
            </>
          ) : (
            <>
              Temas y sala de esta emisión ({show.name}). Para el acumulado del show andá a{" "}
            </>
          )}
          <Link
            href={`/canales/${headerChannel}?tab=programas&show=${show.id}`}
            className="text-accent font-medium hover:underline"
          >
            {show.name} en {chName[headerChannel] || headerChannelLabel}
          </Link>
          .
        </p>
      </header>

      {program ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Stat
              label="Pico de atención"
              value={program.peak ? compact(program.peak) : "—"}
              hint="concurrentes del programa"
            />
            <Stat
              label="Promedio"
              value={program.avg ? compact(program.avg) : "—"}
              hint="concurrentes"
            />
            <Stat label="Marcas con pauta" value={program.brands.length} hint="en esta emisión" />
            <Stat label="Apariciones de pauta" value={program.pnt_count} hint="verificadas" />
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <a
              href={vodLink(program.video_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Ver en YouTube ↗
            </a>
            <Link href={`/canales/${headerChannel}?tab=programas`} className="btn border border-[#ececec]">
              Ver en canal
            </Link>
          </div>

          {program.brands.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3">Marcas en este programa</h2>
              <div className="flex flex-wrap gap-2">
                {[...new Set(program.pnt.map((r) => r.brand_slug))].map((slug) => {
                  const row = program.pnt.find((r) => r.brand_slug === slug);
                  const count = program.pnt.filter((r) => r.brand_slug === slug).length;
                  return (
                    <Link
                      key={slug}
                      href={`/marcas/${slug}?channel=${program.channel}`}
                      className="text-[13px] px-3 py-1.5 rounded-lg bg-gray-50 text-gray-800 hover:bg-accent-soft hover:text-accent border border-[#ececec]"
                    >
                      {row?.brand_name || slug}
                      <span className="text-gray-400 ml-1.5 tabular-nums">{count}</span>
                    </Link>
                  );
                })}
              </div>
              {topBrand && (
                <p className="text-[12.5px] text-gray-500 mt-3">
                  Momento más fuerte: <b>{topBrand.brand_name}</b> con{" "}
                  {topBrand.conc_at ? `${compact(topBrand.conc_at)} mirando` : "aparición verificada"}.
                </p>
              )}
            </section>
          )}
        </>
      ) : (
        <div className="flex flex-wrap gap-3 mb-8">
          <a
            href={vodLink(videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Ver en YouTube ↗
          </a>
        </div>
      )}

      {topics ? <ProgramTopicsPanel topics={topics} /> : null}

      <AudienceDemandPanel moment={moment} />

      <RoomParticipationPanel
        participation={(moment as { room_participation?: RoomParticipation } | null)?.room_participation}
      />

      {program && program.pnt.length > 0 ? (
      <section>
        <h2 className="text-[15px] font-semibold mb-3">Apariciones en este programa</h2>
        <div className="card overflow-hidden">
          <table>
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Marca</th>
                <th>Minuto</th>
                <th>Prueba</th>
                <th>Respaldo</th>
                <th className="text-right">Atención</th>
                <th>Chat en la pauta</th>
                <th className="text-right">Exposición</th>
              </tr>
            </thead>
            <tbody>
              {program.pnt.map((row, i) => (
                <tr
                  key={i}
                  className="cursor-pointer"
                  onClick={() => setOpenRow(row as unknown as Record<string, unknown>)}
                >
                  <td>
                    <Link
                      href={`/marcas/${row.brand_slug}?channel=${program.channel}`}
                      className="text-accent hover:underline text-[12.5px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.brand_name}
                    </Link>
                  </td>
                  <td className="font-mono text-[12px] text-gray-600 whitespace-nowrap">
                    {row.minute || fmtHMS(row.t_seconds)}
                  </td>
                  <td className="max-w-[220px] text-[12.5px] italic text-gray-600 line-clamp-2">
                    {row.quote ? `“${row.quote}”` : "—"}
                  </td>
                  <td>
                    <Badge tone={evidenceTone(row.evidence)}>
                      {evidenceLabel(row.evidence)}
                    </Badge>
                  </td>
                  <td className="text-right tabular-nums text-[12.5px]">
                    {row.conc_at ? compact(row.conc_at) : "—"}
                  </td>
                  <td className="max-w-[180px]">
                    <div className="flex items-start gap-1.5">
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${chatToneDot(row)}`} aria-hidden />
                      <span className={`text-[11.5px] leading-snug ${chatToneClass(row)}`}>
                        {chatTableLine(row)}
                      </span>
                      {chatEcoLine(row) && (
                        <span className="text-[10px] text-gray-500 leading-snug mt-0.5 block">
                          {chatEcoLine(row)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right tabular-nums text-[12px] text-gray-500">
                    {usdEst(row.value_usd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-3">
          Clic en una fila para ver el Momento de Atención · exposición total est. {usdEst(totalValue)}
        </p>
      </section>
      ) : null}

      {program && program.views > 0 && (
        <p className="text-[12px] text-gray-400 mt-6">
          {num(program.views)} reproducciones VOD de esta emisión ·{" "}
          {program.dur_min ? `${program.dur_min} min de emisión` : "duración no disponible"}
          {moment && (moment as { has_chat?: boolean }).has_chat === false ? " · sin chat capturado" : ""}
        </p>
      )}

      {openRow && (
        <MomentModal
          mention={openRow}
          moment={moment}
          brandName={String(openRow.brand_name || "")}
          onClose={() => setOpenRow(null)}
        />
      )}
    </div>
  );
}
