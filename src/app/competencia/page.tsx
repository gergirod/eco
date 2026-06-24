"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Badge, Bar, Stat } from "@/components/ui";
import BrandPicker from "@/components/BrandPicker";
import { usd, num, compact } from "@/lib/format";
import { useDataset } from "@/lib/useDataset";
import brandsFb from "@/data/brands.json";
import channelsFb from "@/data/channels.json";

const PALETTE = ["#2f5fe0", "#e0742f", "#1f9d6b", "#a23bd1", "#d13b5c"];

export default function Competencia() {
  const BRANDS = useDataset<any[]>("brands", brandsFb);
  const channels = useDataset<any[]>("channels", channelsFb);
  const CH_NAME: Record<string, string> = useMemo(
    () => Object.fromEntries(channels.map((c: any) => [c.id, c.name])),
    [channels]
  );
  const BY_SLUG: Record<string, any> = useMemo(
    () => Object.fromEntries(BRANDS.map((b: any) => [b.slug, b])),
    [BRANDS]
  );
  const options = useMemo(
    () => BRANDS.map((b: any) => ({ slug: b.slug, name: b.name, mentions: b.mentions })),
    [BRANDS]
  );
  const [mine, setMine] = useState("mercado-libre");
  const [rivals, setRivals] = useState<string[]>(["mercado-pago", "cabify"]);

  const all = useMemo(() => [mine, ...rivals].map((s) => BY_SLUG[s]).filter(Boolean), [mine, rivals, BY_SLUG]);
  const maxM = Math.max(...all.map((b) => b.mentions), 1);
  const maxV = Math.max(...all.map((b) => b.value_usd), 1);

  // matriz marca x canal (menciones por canal)
  const channelsUsed = useMemo(() => {
    const set = new Set<string>();
    all.forEach((b) => b.channels.forEach((c: string) => set.add(c)));
    return [...set];
  }, [all]);

  function addRival(slug: string) {
    if (slug === mine || rivals.includes(slug) || rivals.length >= 4) return;
    setRivals((r) => [...r, slug]);
  }

  return (
    <div>
      <PageHeader
        title="Competencia"
        sub="Share of voice entre anunciantes que pautaron: PNT, exposición y presencia por canal."
      />

      <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400">Mi marca</span>
          <BrandPicker options={options} value={mine} onChange={setMine} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400">Agregar competidor</span>
          <BrandPicker options={options} value="" onChange={addRival} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {rivals.map((s, i) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-gray-100">
              <span className="w-2 h-2 rounded-full" style={{ background: PALETTE[(i + 1) % PALETTE.length] }} />
              {BY_SLUG[s]?.name}
              <button onClick={() => setRivals((r) => r.filter((x) => x !== s))} className="text-gray-400 hover:text-gray-700">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-4">PNT acumuladas</h2>
          <div className="flex flex-col gap-3.5">
            {all.map((b, i) => (
              <div key={b.slug}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                    {b.name} {i === 0 && <Badge tone="blue">mi marca</Badge>}
                  </span>
                  <span className="tabular-nums text-gray-500">{num(b.mentions)}</span>
                </div>
                <Bar value={b.mentions} max={maxM} tone={PALETTE[i % PALETTE.length]} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-semibold mb-4">Exposición (lente A)</h2>
          <div className="flex flex-col gap-3.5">
            {all.map((b, i) => (
              <div key={b.slug}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="font-medium">{b.name}</span>
                  <span className="tabular-nums text-gray-500">{usd(b.value_usd)}</span>
                </div>
                <Bar value={b.value_usd} max={maxV} tone={PALETTE[i % PALETTE.length]} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matriz por canal */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#ececec]">
          <h2 className="text-[15px] font-semibold">Presencia por stream</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Solo anunciantes con pauta verificada en el canal</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Marca</th>
              {channelsUsed.map((c) => (
                <th key={c} className="text-center">{CH_NAME[c] || c}</th>
              ))}
              <th className="text-right">Total</th>
              <th className="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {all.map((b, i) => (
              <tr key={b.slug}>
                <td className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <Link href={`/marca?brand=${b.slug}`} className="hover:text-accent hover:underline">
                      {b.name}
                    </Link>
                  </span>
                </td>
                {channelsUsed.map((c) => (
                  <td key={c} className="text-center">
                    {b.channels.includes(c) ? <span className="text-green-600">✓</span> : <span className="text-gray-200">·</span>}
                  </td>
                ))}
                <td className="text-right tabular-nums">{num(b.mentions)}</td>
                <td className="text-right tabular-nums text-gray-500">{usd(b.value_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-400 mt-4">
        Comparación entre marcas con PNT real (no menciones orgánicas). Click en una marca →{" "}
        <Link href="/marca" className="text-accent hover:underline">reporte completo + PDF</Link>.
      </p>
    </div>
  );
}
