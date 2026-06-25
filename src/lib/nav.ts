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
  { href: "/novedades", label: "Novedades", icon: "◇" },
  { href: "/tendencias", label: "Tendencias", icon: "↗" },
];

/** Rutas legacy redirigen vía next.config. Operación interna: /backoffice */
const NAV_INTERNAL = [{ href: "/backoffice", label: "Operación", icon: "⚙" }] as const;

export { NAV_MODULES, NAV_INTERNAL };
export type { NavModule };
