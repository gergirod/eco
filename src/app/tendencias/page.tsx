"use client";
import { useState, useMemo } from "react";
import { PageHeader, Badge } from "@/components/ui";
import { useDataset } from "@/lib/useDataset";
import radarFb from "@/data/radar.json";

function Spark({ serie }: { serie: { date: string; n: number }[] }) {
  if (!serie || serie.length < 2) return <span className="text-gray-300 text-[11px]">—</span>;
  const W = 90,
    H = 26;
  const max = Math.max(...serie.map((s) => s.n), 1);
  const step = W / (serie.length - 1);
  const pts = serie.map((s, i) => `${(i * step).toFixed(1)},${(H - (s.n / max) * (H - 3) - 1).toFixed(1)}`).join(" ");
  const rising = serie[serie.length - 1].n >= serie[0].n;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <polyline points={pts} fill="none" stroke={rising ? "#22a06b" : "#e2574c"} strokeWidth={1.6} />
    </svg>
  );
}

function GTCell({ t }: { t: any }) {
  const s = t.gt_status;
  if (!s) return <span className="text-gray-300 text-[11px]">sin comparar</span>;
  if (s === "pre_busqueda")
    return (
      <span title="Google Trends todavía no registra volumen para este tema en AR">
        <Badge tone="green">pre-búsqueda</Badge>
      </span>
    );
  if (s === "adelantado")
    return (
      <span title="Lo detectamos en streams antes del despegue en Google Trends">
        <Badge tone="blue">+{t.gt_lead_days} días antes</Badge>
      </span>
    );
  if (s === "ya_masivo")
    return (
      <span title="Google ya venía con volumen: llegamos después">
        <Badge tone="gray">ya masivo</Badge>
      </span>
    );
  if (s === "en_linea")
    return (
      <span title="Despegó en streams y en Google casi al mismo tiempo">
        <Badge tone="amber">en línea</Badge>
      </span>
    );
  return <span className="text-gray-300 text-[11px]">s/d</span>;
}

export default function TendenciasPage() {
  const radar = useDataset<any[]>("radar", radarFb);
  const [onlyCross, setOnlyCross] = useState(true);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return radar
      .filter((t) => (onlyCross ? t.cross_comunidad : true))
      .filter((t) => (q ? t.tema.toLowerCase().includes(q.toLowerCase()) : true));
  }, [radar, onlyCross, q]);

  return (
    <div>
      <PageHeader
        title="Radar de Tendencias"
        sub="Capa 2 · señales emergentes cross-canal. Complemento al reporte de pauta, no es el entregable principal."
      />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          className="border border-[#ececec] rounded-lg px-3 py-2 text-[13px] w-[260px] bg-white"
          placeholder="Buscar tema…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer">
          <input type="checkbox" checked={onlyCross} onChange={(e) => setOnlyCross(e.target.checked)} />
          Solo cross-canal (≥2 comunidades)
        </label>
        <span className="text-[12px] text-gray-400 ml-auto">{rows.length} tendencias</span>
      </div>

      <div className="card overflow-hidden">
        <div className="max-h-[640px] overflow-auto">
          <table>
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Tema</th>
                <th>Señal</th>
                <th className="text-right">Score</th>
                <th className="text-right">Menc.</th>
                <th>Canales</th>
                <th>vs Google Trends</th>
                <th>Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => (
                <tr key={i}>
                  <td className="font-medium max-w-[300px]">
                    {t.tema}
                    <span className="block text-[11px] text-gray-400 font-normal">
                      {(t.categorias || []).slice(0, 3).join(" · ")}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {t.candidato && <Badge tone="green">candidato</Badge>}
                      {t.cross_comunidad && <Badge tone="blue">cross-canal</Badge>}
                      {t.multi_dia && <Badge tone="gray">multi-día</Badge>}
                    </div>
                  </td>
                  <td className="text-right tabular-nums font-semibold">{t.score}</td>
                  <td className="text-right tabular-nums text-gray-500">{t.menciones}</td>
                  <td className="text-[12.5px] text-gray-500">{(t.canales || []).join(", ")}</td>
                  <td><GTCell t={t} /></td>
                  <td>
                    <Spark serie={t.serie} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-4 leading-relaxed max-w-[820px]">
        Tendencia = aparición en ≥2 comunidades (filtro anti-meme). El score combina volumen,
        cross-comunidad y persistencia multi-día. La sparkline muestra la evolución de menciones por
        día (verde = subiendo). La columna <b>vs Google Trends</b> compara la primera mención en
        streams contra la fecha de despegue en Google Trends (AR).{" "}
        <b>No reemplaza el reporte de marca</b> (PNT + minuto + concurrentes): es inteligencia extra para
        prospectar temas calientes antes de Google.
      </p>
    </div>
  );
}
