import Link from "next/link";
import { AGENCIA_BASE } from "@/lib/agencia-demo";

type Props = {
  agencyName: string;
};

export default function AgenciaDemoBanner({ agencyName }: Props) {
  return (
    <div className="mb-8 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent-soft via-white to-[#f0fff4] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-2">
            Demo design partner
          </p>
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-ink leading-snug">
            Ejemplo con marcas reales — {agencyName}
          </h2>
          <p className="text-[13.5px] text-gray-600 mt-2 leading-relaxed">
            Mostrá el flujo con un caso real del corpus:{" "}
            <Link href={`${AGENCIA_BASE}/ejemplo`} className="text-accent font-semibold hover:underline">
              6 ejemplos · corpus completo
            </Link>{" "}
            (IOL, YPF/PAE, Hyundai, Skip, Wanderlust, Geniol) — Olga, Luzu, Blender, Neura, Vorterix.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link href={`${AGENCIA_BASE}/ejemplo`} className="btn btn-primary text-[12px] py-2">
            Demo IOL vs MP →
          </Link>
          <Link href={`${AGENCIA_BASE}/ejemplo/ypf-pae`} className="btn border border-[#ececec] bg-white text-[12px] py-2 text-center">
            YPF Blender + Neura →
          </Link>
        </div>
      </div>
    </div>
  );
}
