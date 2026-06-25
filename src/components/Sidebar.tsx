"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import metaFb from "@/data/meta.json";

/** Navegación principal — producto comercial (v1). */
const NAV_VISIBLE = [
  { href: "/discover", label: "Discovery", icon: "◆" },
  { href: "/backoffice", label: "Backoffice", icon: "▤" },
];

/**
 * Rutas ocultas del sidebar (activas por URL directa — restaurar en NAV_VISIBLE cuando corresponda):
 * /campaign · /marca · /certificado · /competencia · /mediakit · /audiencia · /productos · /tendencias
 * / redirige a /discover
 */

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

export default function Sidebar() {
  const path = usePathname();
  const exported = fmtExport((metaFb as any).exported_at || "");
  const onLogin = path === "/backoffice/login";
  const onBackoffice = path.startsWith("/backoffice");

  if (onLogin) {
    return (
      <aside className="w-[228px] shrink-0 border-r border-[#ececec] bg-white px-4 py-6 flex flex-col">
        <div className="px-2 mb-7">
          <div className="text-[15px] font-semibold tracking-tight">Eco</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Operación · acceso interno</div>
        </div>
        <Link href="/discover" className="px-2.5 py-2 text-[13px] text-gray-500 hover:text-accent">
          ← Volver a Discovery
        </Link>
      </aside>
    );
  }

  return (
    <aside className="w-[228px] shrink-0 border-r border-[#ececec] bg-white px-4 py-6 flex flex-col">
      <div className="px-2 mb-7">
        <Link href="/discover" className="block hover:opacity-80 transition-opacity">
          <div className="text-[15px] font-semibold tracking-tight">Eco</div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Inteligencia comercial · streaming
          </div>
        </Link>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV_VISIBLE.map((n) => {
          const active = path === n.href || path.startsWith(`${n.href}/`);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition ${
                active ? "bg-accent-soft text-accent font-medium" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-[13px] opacity-70">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>
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
