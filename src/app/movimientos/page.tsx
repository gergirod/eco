import Link from "next/link";

export default function MovimientosPage() {
  return (
    <div className="max-w-xl">
      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400 font-semibold mb-3">
        Próximamente
      </p>
      <h1 className="text-[28px] font-semibold tracking-tight text-ink leading-tight">
        Movimientos
      </h1>
      <p className="text-[15px] text-gray-600 mt-4 leading-relaxed">
        Estamos definiendo qué inteligencia de tendencias podemos ofrecer con respaldo real. Este
        módulo no está disponible en la versión actual.
      </p>
      <p className="text-[13.5px] text-gray-500 mt-4 leading-relaxed">
        Para investigar pauta verificable hoy, usá{" "}
        <Link href="/marcas" className="text-accent font-medium hover:underline">
          Marcas
        </Link>{" "}
        o compará inventario en{" "}
        <Link href="/canales" className="text-accent font-medium hover:underline">
          Canales
        </Link>
        .
      </p>
    </div>
  );
}
