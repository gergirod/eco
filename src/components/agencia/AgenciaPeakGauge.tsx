"use client";

type Props = {
  concAt: number | null;
  programPeak: number | null;
  className?: string;
};

const VALLE = 40;

export default function AgenciaPeakGauge({ concAt, programPeak, className = "" }: Props) {
  if (concAt == null || programPeak == null || programPeak <= 0) {
    return (
      <p className={`text-[12px] text-gray-400 ${className}`}>Sin benchmark de pico del programa</p>
    );
  }

  const pct = Math.round((concAt / programPeak) * 100);
  const isValley = pct < VALLE;
  const barPct = Math.min(pct, 100);

  return (
    <div className={className}>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-gray-500">Tu minuto vs pico del programa</span>
        <span
          className={`font-semibold tabular-nums ${isValley ? "text-amber-700" : "text-green-700"}`}
        >
          {pct}% {isValley ? "· VALLE" : "· OK"}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 w-[40%] bg-amber-100/80 border-r border-amber-300/50"
          title="Zona valle (&lt;40%)"
        />
        <div
          className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 ${
            isValley ? "bg-amber-500" : "bg-green-500"
          }`}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">
        Bajo 40% = no repetir sin renegociar · esto no es un PDF, es la regla de Guard
      </p>
    </div>
  );
}
