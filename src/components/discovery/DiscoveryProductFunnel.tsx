import Link from "next/link";

const IOL_ADVERTISER_SLUG = "iol-inversiones";

const STEPS = [
  { n: 1, title: "Marcas", desc: "Investigá quién pauta y con qué respaldo" },
  { n: 2, title: "Evidencia", desc: "Revisá dónde y cuándo apareció" },
  { n: 3, title: "Informe de entrega", desc: "Comprobá la inversión y descargá el PDF" },
];

export default function DiscoveryProductFunnel() {
  return (
    <section className="my-14 py-8 px-6 sm:px-8 rounded-2xl bg-white border border-[#ececec] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-[17px] font-semibold tracking-tight text-ink mb-1">
        De la curiosidad al informe
      </h2>
      <p className="text-[13px] text-gray-500 mb-8 max-w-xl">
        El camino completo para defender una inversión en streaming con evidencia independiente.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {STEPS.map((step, i) => (
          <div key={step.n} className="relative">
            {i < STEPS.length - 1 && (
              <span
                className="hidden sm:block absolute top-4 left-[calc(50%+1.25rem)] w-[calc(100%-2.5rem)] h-px bg-gray-200"
                aria-hidden
              />
            )}
            <div className="flex flex-col items-start gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent text-[13px] font-semibold">
                {step.n}
              </span>
              <span className="text-[14px] font-medium text-ink">{step.title}</span>
              <span className="text-[12.5px] text-gray-500 leading-snug">{step.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <Link
        href={`/marcas/${IOL_ADVERTISER_SLUG}`}
        className="btn btn-primary inline-flex"
      >
        Investigar IOL →
      </Link>
    </section>
  );
}
