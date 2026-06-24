"use client";
import { useState, useMemo } from "react";
import { PageHeader, Badge } from "@/components/ui";
import { usd, num } from "@/lib/format";
import { useDataset } from "@/lib/useDataset";
import brandsFb from "@/data/brands.json";
import productsFb from "@/data/products.json";
import channelsFb from "@/data/channels.json";

export default function Catalogo() {
  const brands = useDataset<any[]>("brands", brandsFb);
  const products = useDataset<any[]>("products", productsFb);
  const channels = useDataset<any[]>("channels", channelsFb);
  const CH_NAME: Record<string, string> = useMemo(
    () => Object.fromEntries(channels.map((c: any) => [c.id, c.name])),
    [channels]
  );
  const ALL = useMemo(() => [...brands, ...products], [brands, products]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"todo" | "marca" | "producto">("marca");
  const [minM, setMinM] = useState(2);
  const [sort, setSort] = useState<"mentions" | "value" | "channels">("mentions");

  const rows = useMemo(() => {
    let r = ALL.filter((x) => (kind === "todo" ? true : x.kind === kind));
    r = r.filter((x) => x.mentions >= minM);
    if (q) r = r.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()));
    r.sort((a, b) =>
      sort === "value" ? b.value_usd - a.value_usd : sort === "channels" ? b.n_channels - a.n_channels : b.mentions - a.mentions
    );
    return r;
  }, [q, kind, minM, sort, ALL]);

  return (
    <div>
      <PageHeader
        title="Catálogo de marcas"
        sub="Universo acumulado de marcas y productos nombrados. Filtrá y elegí a quién monitorear o comparar."
      />

      <div className="card p-3.5 mb-5 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className="px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-accent w-[220px]"
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["marca", "producto", "todo"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium capitalize ${
                kind === k ? "bg-white shadow-sm text-ink" : "text-gray-500"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[12.5px] text-gray-500">
          mín. menciones
          <select value={minM} onChange={(e) => setMinM(Number(e.target.value))} className="border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
            {[1, 2, 3, 5, 10].map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-[12.5px] text-gray-500">
          ordenar
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
            <option value="mentions">menciones</option>
            <option value="value">valor</option>
            <option value="channels">cobertura</option>
          </select>
        </div>
        <span className="text-[12px] text-gray-400 ml-auto">{num(rows.length)} resultados</span>
      </div>

      <div className="card overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Marca / producto</th>
              <th>Tipo</th>
              <th className="text-right">Menciones</th>
              <th className="text-right">Canales</th>
              <th>Aparece en</th>
              <th>Período</th>
              <th className="text-right">Valor ref.</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 300).map((x) => (
              <tr key={x.kind + x.slug}>
                <td className="font-medium">{x.name}</td>
                <td>
                  <Badge tone={x.kind === "marca" ? "blue" : "gray"}>{x.kind}</Badge>
                </td>
                <td className="text-right tabular-nums">{num(x.mentions)}</td>
                <td className="text-right tabular-nums">{x.n_channels}</td>
                <td className="text-gray-500 text-[12.5px]">{x.channels.map((c: string) => CH_NAME[c] || c).join(", ")}</td>
                <td className="text-gray-400 text-[12px] whitespace-nowrap">{x.first_seen} – {x.last_seen}</td>
                <td className="text-right tabular-nums text-gray-500">{usd(x.value_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 300 && (
        <p className="text-[11px] text-gray-400 mt-3">Mostrando primeros 300 de {num(rows.length)}. Afiná con los filtros.</p>
      )}
    </div>
  );
}
