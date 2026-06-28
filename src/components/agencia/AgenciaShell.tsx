"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import AgenciaBrandBar from "@/components/agencia/AgenciaBrandBar";
import AgenciaBrandRoleBadge from "@/components/agencia/AgenciaBrandRoleBadge";
import AgenciaStoryRail from "@/components/agencia/AgenciaStoryRail";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { brandDisplayName } from "@/lib/agencia-roles";
import { useActiveBrand } from "@/lib/use-active-brand";
import { useCorpus } from "@/lib/useCorpus";

const NAV = [
  { href: AGENCIA_BASE, label: "¿Rindió la placa?", exact: true },
  { href: `${AGENCIA_BASE}/donde`, label: "¿Dónde pautar?" },
  { href: `${AGENCIA_BASE}/pulso`, label: "¿Quién ganó miradas?", needsRival: true },
] as const;

const MINIMAL_PATHS = ["/elegir", "/configurar", "/ejemplo", "/demo", "/marcas"];

function isActive(path: string, href: string, exact?: boolean) {
  if (exact) return path === href;
  return path === href || path.startsWith(`${href}/`);
}

function isMinimalChrome(path: string): boolean {
  return MINIMAL_PATHS.some((p) => path.startsWith(`${AGENCIA_BASE}${p}`));
}

export default function AgenciaShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { config, hasRival, activePair } = useActiveBrand();
  const { brands } = useCorpus(["brands"] as const);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const names = useMemo(
    () =>
      Object.fromEntries(
        (brands as { slug: string; name: string }[]).map((b) => [b.slug, b.name])
      ),
    [brands]
  );

  const minimal = isMinimalChrome(path);
  const navItems = NAV.filter((item) => !("needsRival" in item && item.needsRival) || hasRival);
  const showStory = !minimal && Boolean(activePair);

  const navLinks = (
    <>
      {!minimal && config.brandSlugs.length > 0 && (
        <nav className="flex flex-col gap-0.5 mb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNav(false)}
              className={`px-2.5 py-2.5 rounded-lg text-[13px] leading-snug transition ${
                isActive(path, item.href, "exact" in item ? item.exact : false)
                  ? "bg-accent-soft text-accent font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[248px] shrink-0 border-r border-[#e8e8e8] bg-white px-4 py-6 flex-col">
        <div className="px-2 mb-5">
          <Link href={AGENCIA_BASE} className="block hover:opacity-80">
            <div className="text-[15px] font-semibold tracking-tight">Eco</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{config.name}</div>
          </Link>
        </div>

        {navLinks}

        {!minimal && config.pairs.length > 0 && (
          <div className="px-2 pb-4 border-b border-[#ececec]">
            <button
              type="button"
              onClick={() => setPortfolioOpen(!portfolioOpen)}
              className="text-[10px] uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1 hover:text-gray-600"
            >
              <span className={`transition ${portfolioOpen ? "rotate-90" : ""}`}>▸</span>
              Evidencia por marca
            </button>
            {portfolioOpen && (
              <nav className="flex flex-col gap-1">
                {config.pairs.map((pair) => {
                  const compSlug = pair.competitorSlug;
                  return (
                    <div
                      key={pair.slug}
                      className="rounded-lg border border-[#f0f0f0] overflow-hidden mb-1"
                    >
                      <Link
                        href={`${AGENCIA_BASE}/marcas/${pair.slug}`}
                        className="flex items-center justify-between gap-2 px-2.5 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                      >
                        <span className="truncate">{brandDisplayName(pair.slug, names)}</span>
                        <AgenciaBrandRoleBadge
                          role="cliente"
                          className="!text-[9px] !px-1.5 shrink-0"
                        />
                      </Link>
                      {compSlug && (
                        <Link
                          href={`${AGENCIA_BASE}/marcas/${compSlug}`}
                          className="flex items-center justify-between gap-2 px-2.5 py-2 text-[12px] border-t border-[#f5f5f5] text-gray-500 hover:bg-gray-50"
                        >
                          <span className="truncate">{brandDisplayName(compSlug, names)}</span>
                          <AgenciaBrandRoleBadge
                            role="competidor"
                            className="!text-[9px] !px-1.5 shrink-0"
                          />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>
            )}
          </div>
        )}

        <div className="mt-auto px-2 pt-6 space-y-2">
          <Link
            href={`${AGENCIA_BASE}/elegir`}
            className="block text-[12px] text-gray-500 hover:text-accent"
          >
            Cambiar marca →
          </Link>
          {config.brandSlugs.length > 1 && (
            <Link
              href={`${AGENCIA_BASE}/configurar`}
              className="block text-[12px] text-gray-500 hover:text-accent"
            >
              Configuración →
            </Link>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        {!minimal && (
          <header className="md:hidden sticky top-0 z-20 border-b border-[#ececec] bg-white px-4 py-3 flex items-center justify-between">
            <Link href={AGENCIA_BASE} className="text-[15px] font-semibold">
              Eco
            </Link>
            <button
              type="button"
              onClick={() => setMobileNav(!mobileNav)}
              className="text-[13px] text-gray-600 px-3 py-1.5 rounded-lg border border-[#ececec]"
              aria-expanded={mobileNav}
            >
              Menú
            </button>
          </header>
        )}

        {mobileNav && !minimal && (
          <div className="md:hidden border-b border-[#ececec] bg-white px-4 py-4">
            {navLinks}
            <Link
              href={`${AGENCIA_BASE}/elegir`}
              onClick={() => setMobileNav(false)}
              className="block text-[12px] text-accent mt-3"
            >
              Cambiar marca →
            </Link>
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-7">
          {showStory && (
            <>
              <AgenciaBrandBar />
              <AgenciaStoryRail hasRival={hasRival} />
            </>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
