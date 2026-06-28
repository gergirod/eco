import type { BrandRole } from "@/lib/agencia-roles";

const STYLES: Record<BrandRole, string> = {
  cliente: "bg-accent-soft text-accent border-accent/20",
  competidor: "bg-amber-50 text-amber-900 border-amber-200",
  rubro: "bg-gray-50 text-gray-500 border-gray-200",
};

const LABELS: Record<BrandRole, string> = {
  cliente: "Tu marca",
  competidor: "Competidor",
  rubro: "Rubro",
};

type Props = {
  role: BrandRole;
  className?: string;
};

export default function AgenciaBrandRoleBadge({ role, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full border ${STYLES[role]} ${className}`}
    >
      {LABELS[role]}
    </span>
  );
}
