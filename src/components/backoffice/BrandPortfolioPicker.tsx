"use client";

import { useMemo } from "react";
import {
  brandOptionLabel,
  emptyBrandPair,
  listBrandOptions,
  type BrandPair,
} from "@/lib/brand-catalog";

type Props = {
  value: BrandPair[];
  onChange: (pairs: BrandPair[]) => void;
  maxPairs: number;
};

function BrandSelect({
  label,
  value,
  onChange,
  excludeSlug,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (slug: string) => void;
  excludeSlug?: string;
  placeholder: string;
}) {
  const options = useMemo(() => {
    return listBrandOptions().filter((b) => b.slug !== excludeSlug);
  }, [excludeSlug]);

  return (
    <label className="block text-[12px] text-gray-600 flex-1 min-w-0">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px] bg-white truncate"
        required
      >
        <option value="">{placeholder}</option>
        {options.map((b) => (
          <option key={b.slug} value={b.slug}>
            {brandOptionLabel(b)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function BrandPortfolioPicker({ value, onChange, maxPairs }: Props) {
  const usedBrandSlugs = new Set(value.map((p) => p.brandSlug).filter(Boolean));

  function updateRow(index: number, patch: Partial<BrandPair>) {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  }

  function addRow() {
    if (value.length >= maxPairs) return;
    onChange([...value, emptyBrandPair()]);
  }

  function removeRow(index: number) {
    if (value.length <= 1) return;
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="sm:col-span-2 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[12px] font-medium text-gray-700">Marcas del contrato</div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Una fila por marca monitoreada + su competidor de referencia
          </p>
        </div>
        {value.length < maxPairs && (
          <button
            type="button"
            onClick={addRow}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-[#ececec] text-gray-600 hover:bg-gray-50 shrink-0"
          >
            + Agregar marca
          </button>
        )}
      </div>

      <div className="space-y-3">
        {value.map((pair, index) => {
          const brandTakenElsewhere =
            pair.brandSlug &&
            value.some((p, i) => i !== index && p.brandSlug === pair.brandSlug);

          return (
            <div
              key={index}
              className="p-3 rounded-lg border border-[#ececec] bg-gray-50/80 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                  Marca {index + 1}
                </span>
                {value.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-[11px] text-gray-400 hover:text-red-600"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                <BrandSelect
                  label="Marca del cliente"
                  value={pair.brandSlug}
                  onChange={(slug) =>
                    updateRow(index, {
                      brandSlug: slug,
                      competitorSlug:
                        slug && pair.competitorSlug === slug ? "" : pair.competitorSlug,
                    })
                  }
                  excludeSlug={undefined}
                  placeholder="Elegí una marca…"
                />
                <span className="hidden sm:block text-gray-300 pb-2 shrink-0">vs</span>
                <BrandSelect
                  label="Competidor a trackear"
                  value={pair.competitorSlug}
                  onChange={(slug) => updateRow(index, { competitorSlug: slug })}
                  excludeSlug={pair.brandSlug || undefined}
                  placeholder="Elegí competidor…"
                />
              </div>
              {brandTakenElsewhere && (
                <p className="text-[11px] text-amber-700">Esta marca ya está en otra fila.</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400">
        {value.length} de {maxPairs} marca{maxPairs === 1 ? "" : "s"} del plan ·{" "}
        {listBrandOptions().length} marcas en el corpus
      </p>
    </div>
  );
}
