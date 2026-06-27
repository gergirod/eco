"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import metaFb from "@/data/meta.json";
import { usePartner } from "@/contexts/PartnerContext";
import { NAV_INTERNAL, getNavModules, isNavActive, type NavModule } from "@/lib/nav";

function fmtExport(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function NavLink({ item, active }: { item: NavModule; active: boolean }) {
  if (item.comingSoon) {
    return (
      <div
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-gray-400 cursor-default"
        aria-disabled="true"
        title="Próximamente"
      >
        <span className="text-[13px] opacity-50">{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        <span className="text-[10px] uppercase tracking-wide text-gray-300 font-medium">
          Próximamente
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition ${
        active ? "bg-accent-soft text-accent font-medium" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span className="text-[13px] opacity-70">{item.icon}</span>
      {item.label}
    </Link>
  );
}

export default function Sidebar() {
  const path = usePathname();
  const { isScoped, isAdmin, partner, logout } = usePartner();
  const exported = fmtExport((metaFb as { exported_at?: string }).exported_at || "");
  const onLogin = path === "/acceso";
  const onBackoffice = path.startsWith("/backoffice");

  const navModules = getNavModules({
    showCompetencia:
      !isScoped || Boolean(partner && partner.competitor_slugs.length > 0),
  });

  if (onLogin) {
    return (
      <aside className="w-[228px] shrink-0 border-r border-[#ececec] bg-white px-4 py-6 flex flex-col">
        <div className="px-2 mb-7">
          <div className="text-[15px] font-semibold tracking-tight">Eco</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Acceso</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[228px] shrink-0 border-r border-[#ececec] bg-white px-4 py-6 flex flex-col">
      <div className="px-2 mb-7">
        <Link href="/marcas" className="block hover:opacity-80 transition-opacity">
          <div className="text-[15px] font-semibold tracking-tight">Eco</div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {isAdmin
              ? "Admin ECO"
              : isScoped && partner
                ? partner.name
                : "Inteligencia comercial · streaming"}
          </div>
        </Link>
      </div>

      {isScoped && partner && (
        <div className="px-2 mb-4 pb-4 border-b border-[#ececec]">
          <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Tus marcas</div>
          <nav className="flex flex-col gap-0.5">
            {partner.brand_slugs.map((slug) => (
              <Link
                key={slug}
                href={`/marcas/${slug}`}
                className={`px-2.5 py-1.5 rounded-lg text-[12px] ${
                  path === `/marcas/${slug}`
                    ? "bg-accent-soft text-accent font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {slug.replace(/-/g, " ")}
              </Link>
            ))}
            {partner.competitor_slugs.map((slug) => (
              <Link
                key={slug}
                href={`/marcas/${slug}`}
                className={`px-2.5 py-1.5 rounded-lg text-[12px] ${
                  path === `/marcas/${slug}`
                    ? "bg-gray-100 text-gray-800 font-medium"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {slug.replace(/-/g, " ")}
                <span className="text-[9px] uppercase text-gray-400 ml-1">comp.</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      <nav className="flex flex-col gap-0.5">
        {navModules.map((n) => (
          <NavLink key={n.href} item={n} active={isNavActive(path, n)} />
        ))}
      </nav>

      {isAdmin && (
        <div className="mt-6 pt-4 border-t border-[#ececec]">
          <nav className="flex flex-col gap-0.5">
            {NAV_INTERNAL.map((n) => (
              <NavLink
                key={n.href}
                item={n}
                active={path === n.href || path.startsWith(`${n.href}/`)}
              />
            ))}
          </nav>
        </div>
      )}

      {(isScoped || isAdmin) && (
        <button
          type="button"
          onClick={() => logout()}
          className="mt-6 px-2.5 py-2 text-left text-[12px] text-gray-400 hover:text-gray-600"
        >
          Cerrar sesión
        </button>
      )}

      {onBackoffice && (
        <div className="mt-auto px-2 pt-6">
          <div className="text-[10px] text-gray-300 leading-relaxed">
            Consola de operación
            {exported && (
              <>
                <br />
                Datos al {exported}
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
