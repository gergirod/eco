/** Navegación principal — SPEC-006 */

type NavModule = {
  href: string;
  label: string;
  icon: string;
  comingSoon?: boolean;
};

const NAV_MODULES: NavModule[] = [
  { href: "/marcas", label: "Marcas", icon: "◆" },
  { href: "/campanas", label: "Entregas", icon: "✓" },
  { href: "/canales", label: "Canales", icon: "▣" },
  { href: "/conversacion", label: "Conversación", icon: "◎" },
  { href: "/novedades", label: "Novedades", icon: "◇" },
  { href: "/tendencias", label: "Tendencias", icon: "↗" },
];

const NAV_COMPETENCIA: NavModule = {
  href: "/competencia",
  label: "Competencia",
  icon: "⚖",
};

/** Rutas legacy redirigen vía next.config. Operación interna: /backoffice */
const NAV_INTERNAL = [{ href: "/backoffice", label: "Operación", icon: "⚙" }] as const;

type NavOptions = {
  /** Cliente con marcas propias — muestra Competencia si hay rivales configurados. */
  showCompetencia?: boolean;
};

function getNavModules(options: NavOptions = {}): NavModule[] {
  const items = [...NAV_MODULES];
  if (options.showCompetencia) {
    items.splice(2, 0, NAV_COMPETENCIA);
  }
  return items;
}

function isNavActive(path: string, item: NavModule): boolean {
  if (item.comingSoon) return false;
  if (path === item.href || path.startsWith(`${item.href}/`)) return true;
  if (item.href === "/marcas" && path.startsWith("/campanas")) return false;
  if (item.href === "/campanas" && path.startsWith("/campanas")) return true;
  if (item.href === "/canales" && path.startsWith("/programas")) return true;
  return false;
}

export { NAV_MODULES, NAV_COMPETENCIA, NAV_INTERNAL, getNavModules, isNavActive };
export type { NavModule, NavOptions };
