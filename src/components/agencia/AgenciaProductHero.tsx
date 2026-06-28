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
          ? `${agencyName ?? "Media Norte"} — te avisamos por WhatsApp cuando sale la placa de tu cliente; Dónde te ayuda a elegir el próximo programa. Todo con link al video, sin PDF.`
          : "Seenka te dice que salió. El canal te manda una captura. Nosotros te decimos cuánta gente miraba en ese momento y dónde no conviene volver a poner plata."}
      </p>
      {isPreview && (
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <Link
            href={AGENCIA_BASE}
            className="px-3 py-1.5 rounded-full border border-accent/30 bg-accent-soft text-accent"
          >
            <strong>Alertas</strong> · ¿salió la placa?
          </Link>
          <Link
            href={`${AGENCIA_BASE}/donde`}
            className="px-3 py-1.5 rounded-full border border-[#ececec] bg-white hover:border-accent/30"
          >
            <strong>Dónde</strong> · próxima compra
          </Link>
          <Link
            href={`${AGENCIA_BASE}/pulso`}
            className="px-3 py-1.5 rounded-full border border-[#ececec] bg-white hover:border-accent/30"
          >
            <strong>Rivales</strong> · quién ganó miradas
          </Link>
        </div>
      )}
    </div>
  );
}
