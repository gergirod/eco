"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import AgenciaShowcaseView from "@/components/agencia/AgenciaShowcaseView";
import { AGENCIA_BASE } from "@/lib/agencia-demo";
import { getShowcase } from "@/lib/agencia-showcase";

export default function AgenciaEjemploDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const showcase = getShowcase(id);

  if (!showcase) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[14px] text-gray-600 mb-4">Ejemplo no encontrado.</p>
        <Link href={`${AGENCIA_BASE}/ejemplo`} className="text-accent hover:underline">
          Ver los 4 ejemplos
        </Link>
      </div>
    );
  }

  return <AgenciaShowcaseView showcase={showcase} />;
}
