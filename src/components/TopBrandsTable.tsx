"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { VALUATION_BULLETS } from "@/lib/valuation";
import InfoTip from "@/components/InfoTip";
import { usd } from "@/lib/format";
import { VALUATION_INFO, VALUATION_BULLETS, usdEst } from "@/lib/valuation";

const PREVIEW = 8;

export default function TopBrandsTable({
  brands,
}: {
  brands: { slug: string; name: string; mentions: number; value_usd: number }[];
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? brands : brands.slice(0, PREVIEW);

  return (
    <>
      <div className="flex items-start gap-1.5 text-[11px] text-gray-500 mb-2 leading-relaxed">
        <span>
          <span className="font-medium text-gray-700">Exposición en rango estimado.</span>{" "}
          {VALUATION_BULLETS.what}
        </span>
        <InfoTip text={VALUATION_INFO} label="Qué significa la exposición en USD" />
      </div>
      <table>
        <tbody>
          {visible.map((b) => (
            <tr key={b.slug}>
              <td className="font-medium">
                <Link href={`/marca?brand=${b.slug}`} className="hover:text-accent hover:underline">
                  {b.name}
                </Link>
              </td>
              <td className="text-gray-400 text-right tabular-nums">{b.mentions} PNT</td>
              <td className="text-right">
                <Badge tone="blue">{usdEst(b.value_usd, true)}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {brands.length > PREVIEW && (
        <button
          type="button"
          className="mt-3 text-[12px] text-accent hover:underline"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Ver menos" : `Ver todas (${brands.length} marcas)`}
        </button>
      )}
    </>
  );
}
