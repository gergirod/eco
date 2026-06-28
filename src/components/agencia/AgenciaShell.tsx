"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { brandDisplayName } from "@/lib/agencia-roles";
import { useAgenciaConfig } from "@/lib/use-agencia-config";
import { useCorpus } from "@/lib/useCorpus";

const NAV = [
  { href: `${AGENCIA_BASE}/demo`, label: "Demo", icon: "★" },
  { href: AGENCIA_BASE, label: "Guard", icon: "◉", exact: true },
  { href: `${AGENCIA_BASE}/donde`, label: "Dónde", icon: "◈" },
  { href: `${AGENCIA_BASE}/pulso`, label: "Rivales", icon: "⚖" },
  { href: `${AGENCIA_BASE}/configurar`, label: "Marcas", icon: "✎" },
] as const;

function isActive(path: string, href: string, exact?: boolean) {
  if (exact) return path === href;
  return path === href || path.startsWith(`${href}/`);
}

export default function AgenciaShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { config } = useAgenciaConfig();
  const { brands } = useCorpus(["brands"] as const);

  const names = useMemo(
    () =>
      Object.fromEntries(
        (brands as { slug: string; name: string }[]).map((b) => [b.slug, b.name])
      ),
    [brands]
  );

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <aside className="w-[248px] shrink-0 border-r border-[#e8e8e8] bg-white px-4 py-6 flex flex-col">
        <div className="px-2 mb-5">
          <Link href={AGENCIA_BASE} className="block hover:opacity-80">
            <div className="text-[15px] font-semibold tracking-tight">Eco</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{config.name}</div>
            {config.isPreview && (
              <div className="mt-2 text-[10px] uppercase tracking-wide text-accent font-medium">
                Demo · marcas reales
              </div>
            )}
          </Link>
        </div>

        <div className="px-2 mb-4 pb-4 border-b border-[#ececec]">
          <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Portfolio</div>
          <nav className="flex flex-col gap-1">
            {config.pairs.map((pair) => {
              const compSlug = pair.competitorSlug;
              const clientActive = path === `${AGENCIA_BASE}/marcas/${pair.slug}`;
              const compActive = compSlug && path === `${AGENCIA_BASE}/marcas/${compSlug}`;
              return (
                <div key={pair.slug} className="rounded-lg border border-[#f0f0f0] overflow-hidden mb-1">
                  <Link
                    href={`${AGENCIA_BASE}/marcas/${pair.slug}`}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 text-[12px] ${
                      clientActive ? "bg-accent-soft text-accent font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate">{brandDisplayName(pair.slug, names)}</span>
                    <AgenciaBrandRoleBadge role="cliente" className="!text-[9px] !px-1.5 shrink-0" />
                  </Link>
                  {compSlug && (
                    <Link
                      href={`${AGENCIA_BASE}/marcas/${compSlug}`}
                      className={`flex items-center justify-between gap-2 px-2.5 py-2 text-[12px] border-t border-[#f5f5f5] ${
                        compActive ? "bg-amber-50 text-amber-900 font-medium" : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{brandDisplayName(compSlug, names)}</span>
                      <AgenciaBrandRoleBadge role="competidor" className="!text-[9px] !px-1.5 shrink-0" />
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition ${
                isActive(path, item.href, item.exact)
                  ? "bg-accent-soft text-accent font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-[13px] opacity-70">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-2 pt-6">
          <div className="text-[10px] text-gray-300 leading-relaxed">
            {config.isPreview ? (
              <>
                Preview para mostrar en call
                <br />
                <Link href="/marcas" className="text-gray-400 hover:text-accent">
                  ← Explorador ECO
                </Link>
              </>
            ) : (
              "Solo tus marcas y competidores del contrato"
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-6 sm:px-8 py-7 max-w-[1000px]">{children}</main>
    </div>
  );
}
