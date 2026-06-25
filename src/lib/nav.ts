/** Navegación principal — SPEC-005 */

type NavModule = {
  href: string;
  label: string;
  icon: string;
  comingSoon?: boolean;
};

const NAV_MODULES: NavModule[] = [
  { href: "/marcas", label: "Marcas", icon: "◆" },
  { href: "/canales", label: "Canales", icon: "▣" },
  { href: "/campanas", label: "Campañas", icon: "✓" },
  { href: "/movimientos", label: "Movimientos", icon: "↗", comingSoon: true },
];

/** Rutas legacy redirigen vía next.config. Operación interna: /backoffice */
const NAV_INTERNAL = [{ href: "/backoffice", label: "Operación", icon: "⚙" }] as const;

export { NAV_MODULES, NAV_INTERNAL };
export type { NavModule };
