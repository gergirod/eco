import Link from "next/link";
import { AGENCIA_BASE } from "@/lib/agencia-demo";

type Props = {
  isPreview?: boolean;
  agencyName?: string;
};

export default function AgenciaProductHero({ isPreview, agencyName }: Props) {
  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-2">
        {isPreview ? "Demo agencia boutique" : "ECO para tu agencia"}
      </p>
      <blockquote className="text-[17px] sm:text-[19px] font-medium text-ink leading-snug tracking-tight max-w-2xl">
        &ldquo;¿Cuánta gente miraba cuando dijeron la marca, valió la pena, y dónde conviene pautar
        la próxima?&rdquo;
      </blockquote>
      <p className="text-[13px] text-gray-500 mt-3 max-w-xl leading-relaxed">
        {isPreview
          ? `${agencyName ?? "Media Norte"} — dos productos con data real: verificar entrega (Guard) y elegir mejor slot (Dónde). Sin reporte. Sin agente fake.`
          : "Seenka confirma que salió. El canal manda screenshot. ECO mide atención y te dice dónde no gastar de nuevo."}
      </p>
      {isPreview && (
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <Link
            href={AGENCIA_BASE}
            className="px-3 py-1.5 rounded-full border border-accent/30 bg-accent-soft text-accent"
          >
            <strong>Guard</strong> · ¿rindió? + alerta
          </Link>
          <Link
            href={`${AGENCIA_BASE}/donde`}
            className="px-3 py-1.5 rounded-full border border-[#ececec] bg-white hover:border-accent/30"
          >
            <strong>Dónde</strong> · audiencia + slot
          </Link>
          <Link
            href={`${AGENCIA_BASE}/pulso`}
            className="px-3 py-1.5 rounded-full border border-[#ececec] bg-white hover:border-accent/30"
          >
            <strong>Rivales</strong> · competencia
          </Link>
        </div>
      )}
    </div>
  );
}
