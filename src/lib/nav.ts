/** Navegación principal — SPEC-006 */

type NavModule = {
  href: string;
  label: string;
  icon: string;
  comingSoon?: boolean;
};

const NAV_MODULES: NavModule[] = [
  { href: "/marcas", label: "Marcas", icon: "◆" },
  { href: "/canales", label: "Canales", icon: "▣" },
  { href: "/donde-pautar", label: "Dónde pautar", icon: "◈" },
  { href: "/conversacion", label: "Conversación", icon: "◎" },
  { href: "/novedades", label: "Novedades", icon: "◇" },
  { href: "/tendencias", label: "Tendencias", icon: "↗" },
];

/** Rutas legacy redirigen vía next.config. Operación interna: /backoffice */
const NAV_INTERNAL = [{ href: "/backoffice", label: "Operación", icon: "⚙" }] as const;

function isNavActive(path: string, item: NavModule): boolean {
  if (item.comingSoon) return false;
  if (path === item.href || path.startsWith(`${item.href}/`)) return true;
  if (item.href === "/marcas" && path.startsWith("/campanas")) return true;
  if (item.href === "/canales" && path.startsWith("/programas")) return true;
  return false;
}

export { NAV_MODULES, NAV_INTERNAL, isNavActive };
export type { NavModule };
