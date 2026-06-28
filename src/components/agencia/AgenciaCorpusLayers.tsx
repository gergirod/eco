import type { CorpusLayer } from "@/lib/agencia-product";

type Props = {
  layers: CorpusLayer[];
  title?: string;
};

export default function AgenciaCorpusLayers({ layers, title = "Capas del corpus usadas" }: Props) {
  const used = layers.filter((l) => l.used).length;

  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="text-[14px] font-semibold">{title}</h2>
        <span className="text-[12px] text-gray-400">
          {used}/{layers.length} activas
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`rounded-lg px-3 py-2.5 border ${
              layer.used
                ? "border-accent/25 bg-accent-soft/40"
                : "border-gray-100 bg-gray-50 opacity-60"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${layer.used ? "bg-accent" : "bg-gray-300"}`}
              />
              <span className="text-[12px] font-medium text-ink">{layer.label}</span>
            </div>
            <p className="text-[11.5px] text-gray-500 leading-snug">{layer.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
