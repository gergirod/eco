"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { SHOWCASES } from "@/lib/agencia-showcase";
import { brandOptionLabel, listBrandOptions } from "@/lib/brand-catalog";
import { saveBrandChoice } from "@/lib/save-brand-choice";

export default function AgenciaElegirPage() {
  const router = useRouter();
  const brands = useMemo(() => listBrandOptions().filter((b) => b.mentions > 0), []);
  const [brandSlug, setBrandSlug] = useState(brands[0]?.slug ?? "");
  const [rivalSlug, setRivalSlug] = useState("");
  const [withRival, setWithRival] = useState(false);

  const rivalOptions = useMemo(
    () => brands.filter((b) => b.slug !== brandSlug),
    [brands, brandSlug]
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandSlug) return;
    saveBrandChoice(brandSlug, withRival && rivalSlug ? rivalSlug : null);
    router.push(AGENCIA_BASE);
    router.refresh();
  }

  function loadShowcase(id: string) {
    const showcase = SHOWCASES.find((s) => s.id === id);
    if (!showcase) return;
    const pair = showcase.pairs[0];
    saveBrandChoice(pair.slug, pair.competitorSlug);
    router.push(AGENCIA_BASE);
    router.refresh();
  }

  return (
    <div className="max-w-lg pb-12">
      <h1 className="text-[26px] font-semibold tracking-tight text-ink leading-snug">
        ¿Qué marca miramos esta semana?
      </h1>
      <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
        Elegí cualquier cliente del corpus. El rival es opcional — solo si querés comparar share.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-[12px] font-medium text-gray-700">Tu cliente</span>
          <select
            value={brandSlug}
            onChange={(e) => {
              setBrandSlug(e.target.value);
              if (e.target.value === rivalSlug) setRivalSlug("");
            }}
            className="mt-1.5 w-full px-3 py-2.5 border border-[#ececec] rounded-lg text-[14px] bg-white"
            required
          >
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {brandOptionLabel(b)}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-[#ececec] bg-gray-50/80 px-4 py-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={withRival}
              onChange={(e) => setWithRival(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="text-[13px] font-medium text-ink">Quiero comparar con un rival</span>
              <span className="block text-[12px] text-gray-500 mt-0.5">
                Opcional. Sin rival igual ves placas, programas y demanda del rubro.
              </span>
            </span>
          </label>

          {withRival && (
            <select
              value={rivalSlug}
              onChange={(e) => setRivalSlug(e.target.value)}
              className="mt-3 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px] bg-white"
            >
              <option value="">Elegí rival…</option>
              {rivalOptions.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {brandOptionLabel(b)}
                </option>
              ))}
            </select>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full sm:w-auto">
          Ver la semana →
        </button>
      </form>

      <section className="mt-12 pt-8 border-t border-gray-100">
        <p className="text-[12px] uppercase tracking-wide text-gray-400 font-medium mb-3">
          O arrancá con un ejemplo armado
        </p>
        <div className="space-y-2">
          {SHOWCASES.slice(0, 4).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadShowcase(s.id)}
              className="w-full text-left rounded-xl border border-[#ececec] px-4 py-3 hover:border-accent/30 hover:bg-accent-soft/20 transition"
            >
              <span className="text-[14px] font-medium text-ink">{s.title}</span>
              <span className="block text-[12px] text-gray-500 mt-0.5">{s.hook}</span>
            </button>
          ))}
        </div>
        <Link
          href={`${AGENCIA_BASE}/ejemplo`}
          className="inline-block mt-4 text-[12px] text-accent hover:underline"
        >
          Ver los 6 ejemplos →
        </Link>
      </section>

      <p className="text-[11px] text-gray-400 mt-8 leading-relaxed">
        ¿Varios clientes en el contrato?{" "}
        <Link href={`${AGENCIA_BASE}/configurar`} className="text-accent hover:underline">
          Configuración completa
        </Link>
      </p>
    </div>
  );
}
