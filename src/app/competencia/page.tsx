"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader, Bar } from "@/components/ui";
import BrandPicker from "@/components/BrandPicker";
import { usdEst } from "@/lib/valuation";
import ValuationNotice from "@/components/ValuationNotice";
import { useDataset } from "@/lib/useDataset";
import { usePartner } from "@/contexts/PartnerContext";
import brandsFb from "@/data/brands.json";
import channelsFb from "@/data/channels.json";

const PALETTE = ["#2f5fe0", "#e0742f", "#1f9d6b", "#a23bd1", "#d13b5c"];

export default function Competencia() {
  const { isScoped, partner } = usePartner();
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

  const allowedSlugs = useMemo(() => {
    if (!isScoped || !partner) return null;
    return new Set([...partner.brand_slugs, ...partner.competitor_slugs]);
  }, [isScoped, partner]);

  const options = useMemo(() => {
    const pool = BRANDS.map((b: any) => ({ slug: b.slug, name: b.name, mentions: b.mentions }));
    if (!allowedSlugs) return pool;
    return pool.filter((b) => allowedSlugs.has(b.slug));
  }, [BRANDS, allowedSlugs]);

  const defaultMine = partner?.brand_slugs[0] || options[0]?.slug || "mercado-libre";
  const defaultRivals = partner?.competitor_slugs?.slice(0, 3) || ["mercado-pago", "cabify"];

  const [mine, setMine] = useState(defaultMine);
  const [rivals, setRivals] = useState<string[]>(defaultRivals);

  useEffect(() => {
    if (!isScoped || !partner) return;
    if (partner.brand_slugs[0]) setMine(partner.brand_slugs[0]);
    if (partner.competitor_slugs.length) {
      setRivals(partner.competitor_slugs.filter((s) => BY_SLUG[s]).slice(0, 4));
    }
  }, [isScoped, partner, BY_SLUG]);

  const all = useMemo(() => [mine, ...rivals].map((s) => BY_SLUG[s]).filter(Boolean), [mine, rivals, BY_SLUG]);
  const maxM = Math.max(...all.map((b) => b.mentions), 1);
  const maxV = Math.max(...all.map((b) => b.value_usd), 1);

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
        sub="Tu marca contra rivales: apariciones, exposición y presencia por canal en lo que medimos."
      />

      {isScoped && partner && (
        <p className="text-[13px] text-gray-500 mb-4 max-w-2xl">
          Comparando dentro de tu contrato —{" "}
          <b className="text-gray-700">{partner.name}</b>.
        </p>
      )}

      <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400">Mi marca</span>
          <BrandPicker options={options} value={mine} onChange={setMine} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400">Agregar competidor</span>
          <BrandPicker options={options.filter((o) => o.slug !== mine && !rivals.includes(o.slug))} value="" onChange={addRival} />
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

      <div className="mb-5">
        <ValuationNotice compact />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold mb-4">Apariciones de pauta</h2>
          {all.map((b, i) => (
            <div key={b.slug} className="mb-3">
              <div className="flex justify-between text-[13px] mb-1">
                <Link href={`/marcas/${b.slug}`} className="font-medium text-accent hover:underline">
                  {b.name}
                </Link>
                <span className="text-gray-400 tabular-nums">{b.mentions}</span>
              </div>
              <Bar value={b.mentions} max={maxM} tone={PALETTE[i % PALETTE.length]} />
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold mb-4">Exposición estimada</h2>
          {all.map((b, i) => (
            <div key={b.slug} className="mb-3">
              <div className="flex justify-between text-[13px] mb-1">
                <span>{b.name}</span>
                <span className="text-gray-400 tabular-nums">{usdEst(b.value_usd)}</span>
              </div>
              <Bar value={b.value_usd} max={maxV} tone={PALETTE[i % PALETTE.length]} />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-[13px] font-semibold mb-4">Presencia por canal</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                {all.map((b) => (
                  <th key={b.slug} className="text-right">
                    {b.name.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channelsUsed.map((cid) => (
                <tr key={cid}>
                  <td>
                    <Link href={`/canales/${cid}`} className="text-accent hover:underline text-[12.5px]">
                      {CH_NAME[cid] || cid}
                    </Link>
                  </td>
                  {all.map((b) => {
                    const n = (b.by_channel || {})[cid] || 0;
                    return (
                      <td key={b.slug} className="text-right tabular-nums text-[12.5px]">
                        {n || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[12px] text-gray-400 mt-6">
        ¿Querés profundizar una marca? Andá a{" "}
        <Link href="/marcas" className="text-accent hover:underline">
          Marcas
        </Link>
        . ¿Elegir dónde pautar? Mirá{" "}
        <Link href="/canales" className="text-accent hover:underline">
          Canales
        </Link>
        .
      </p>
    </div>
  );
}
