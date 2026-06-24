"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { usd } from "@/lib/format";

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
                <Badge tone="blue">{usd(b.value_usd)}</Badge>
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
