"use client";

type Tab = "pautar" | "demanda";

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
  showDemanda?: boolean;
};

export default function AgenciaDondeTabs({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-1">
      <button
        type="button"
        onClick={() => onChange("pautar")}
        className={`text-[14px] px-1 pb-2.5 border-b-2 transition -mb-px ${
          active === "pautar"
            ? "border-accent text-ink font-semibold"
            : "border-transparent text-gray-500 hover:text-ink"
        }`}
      >
        ¿Dónde pautar?
      </button>
      <button
        type="button"
        onClick={() => onChange("demanda")}
        className={`text-[14px] px-1 pb-2.5 border-b-2 transition -mb-px ${
          active === "demanda"
            ? "border-accent text-ink font-semibold"
            : "border-transparent text-gray-500 hover:text-ink"
        }`}
      >
        ¿Dónde está la demanda?
      </button>
    </div>
  );
}
