"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AGENCIA_BASE } from "@/lib/agencia-demo";

type Step = {
  href: string;
  label: string;
  exact?: boolean;
  needsRival?: boolean;
};

const STEPS: Step[] = [
  { href: AGENCIA_BASE, label: "¿Rindió la placa?", exact: true },
  { href: `${AGENCIA_BASE}/donde`, label: "¿Dónde pautar?" },
  { href: `${AGENCIA_BASE}/pulso`, label: "¿Quién ganó?", needsRival: true },
];

function stepActive(path: string, step: Step): boolean {
  if (step.exact) return path === step.href;
  return path === step.href || path.startsWith(`${step.href}/`);
}

type Props = {
  hasRival: boolean;
};

/** Hilo: placa → mercado → rival (si hay). */
export default function AgenciaStoryRail({ hasRival }: Props) {
  const path = usePathname();
  const steps = STEPS.filter((s) => !s.needsRival || hasRival);

  return (
    <nav
      aria-label="Recorrido de la semana"
      className="mb-8 flex flex-wrap items-center gap-1.5 text-[12px]"
    >
      {steps.map((step, i) => {
        const active = stepActive(path, step);
        return (
          <span key={step.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300">→</span>}
            <Link
              href={step.href}
              className={`px-2.5 py-1 rounded-full border transition ${
                active
                  ? "border-accent/40 bg-accent-soft text-accent font-semibold"
                  : "border-transparent text-gray-500 hover:text-ink hover:bg-gray-50"
              }`}
            >
              {step.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
