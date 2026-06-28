"use client";

import Link from "next/link";
import { AGENCIA_BASE } from "@/lib/agencia-demo";

type Props = {
  brandName: string;
  line: string;
};

export default function AgenciaPlanTeaser({ brandName, line }: Props) {
  return (
    <div className="rounded-xl border border-accent/25 bg-accent-soft/20 px-4 py-4">
      <p className="text-[10px] uppercase tracking-wide text-accent font-semibold mb-2">
        Plan para {brandName}
      </p>
      <p className="text-[14px] text-gray-800 leading-relaxed">{line}</p>
      <Link
        href={`${AGENCIA_BASE}/donde#plan`}
        className="inline-block mt-3 text-[13px] text-accent font-medium hover:underline"
      >
        Ver plan completo →
      </Link>
    </div>
  );
}
