"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import metaFb from "@/data/meta.json";

const NAV = [
  { href: "/", label: "Resumen", icon: "◇" },
  { href: "/backoffice", label: "Backoffice · Runs", icon: "▤", group: "Operación" },
  { href: "/operacion", label: "Runbook · comandos", icon: "⌘", group: "Operación" },
  { href: "/casos", label: "Casos de uso", icon: "?", group: "Operación" },
  { href: "/marca", label: "Reportes de marca", icon: "◉", group: "Venta · entregable" },
  { href: "/certificado", label: "Certificados de emisión", icon: "◎", group: "Venta · entregable" },
  { href: "/competencia", label: "Competencia", icon: "⇄" },
  { href: "/mediakit", label: "Media Kit por canal", icon: "▣" },
  { href: "/audiencia", label: "Audiencia", icon: "◔", group: "Contexto · defensa CPM" },
  { href: "/productos", label: "Prospectos & research", icon: "▦" },
  { href: "/tendencias", label: "Radar (capa 2)", icon: "✷", group: "Inteligencia extra" },
];

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
  const onLogin = path === "/operacion/login";

  if (onLogin) {
    return (
      <aside className="w-[228px] shrink-0 border-r border-[#ececec] bg-white px-4 py-6 flex flex-col">
        <div className="px-2 mb-7">
          <div className="text-[15px] font-semibold tracking-tight">Eco</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Operación · acceso interno</div>
        </div>
        <Link href="/" className="px-2.5 py-2 text-[13px] text-gray-500 hover:text-accent">
          ← Volver al resumen
        </Link>
      </aside>
    );
  }

  return (
    <aside className="w-[228px] shrink-0 border-r border-[#ececec] bg-white px-4 py-6 flex flex-col">
      <div className="px-2 mb-7">
        <div className="text-[15px] font-semibold tracking-tight">Eco</div>
        <div className="text-[11px] text-gray-400 mt-0.5">El eco de tu marca · AR</div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((n, i) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          const showGroup = n.group && n.group !== NAV[i - 1]?.group;
          return (
            <div key={n.href}>
              {showGroup && (
                <div className="text-[10px] uppercase tracking-wider text-gray-300 px-2 mt-4 mb-1">
                  {n.group}
                </div>
              )}
              <Link
                href={n.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition ${
                  active ? "bg-accent-soft text-accent font-medium" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-[13px] opacity-70">{n.icon}</span>
                {n.label}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="mt-auto px-2 pt-6">
        <div className="text-[10px] text-gray-300 leading-relaxed">
          UI interna · datos del pipeline.
          {exported && (
            <>
              <br />
              Export: {exported}
            </>
          )}
          <br />
          <span className="text-gray-400">Reportes = solo PNT verificada</span>
        </div>
      </div>
    </aside>
  );
}
