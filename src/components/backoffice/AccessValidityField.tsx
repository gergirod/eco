"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const PRESETS = [
  { months: 1, label: "1 mes", hint: "Recomendado — renovás cuando pagan" },
  { months: 3, label: "3 meses", hint: "Trimestral" },
  { months: 12, label: "12 meses", hint: "Anual / design partner fundador" },
  { months: 0, label: "Sin vencimiento", hint: "Solo vos lo revocás manualmente" },
] as const;

export default function AccessValidityField({ value, onChange }: Props) {
  const parsed = parseInt(value, 10);
  const selected = Number.isFinite(parsed) ? parsed : 1;

  return (
    <div className="space-y-2">
      <div className="p-3 rounded-lg border border-[#ececec] bg-gray-50/80">
        <div className="text-[12px] font-medium text-gray-700 mb-1">
          Validez del acceso
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
          El link y la sesión del cliente vencen al cumplirse el plazo.{" "}
          <strong>Cada mes que pagan</strong>, tocá &quot;Renovar +1 mes&quot; en su tarjeta — no
          hace falta un link nuevo. Si no pagan, <strong>Dar de baja</strong> corta el acceso al
          instante.
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(String(p.months))}
              className={`text-[11px] px-2.5 py-1.5 rounded-full border transition text-left ${
                selected === p.months
                  ? "bg-accent-soft border-accent text-accent font-medium"
                  : "border-[#ececec] text-gray-600 hover:bg-white"
              }`}
              title={p.hint}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="block text-[12px] text-gray-600 mt-3">
          Meses (personalizado)
          <input
            type="number"
            min={0}
            max={120}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px] bg-white"
            placeholder="1"
          />
        </label>
      </div>
    </div>
  );
}
