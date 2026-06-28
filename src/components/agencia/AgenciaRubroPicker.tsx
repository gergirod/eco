"use client";

type Option = { id: string; label: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
};

export default function AgenciaRubroPicker({ options, value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id || "all"}
            type="button"
            onClick={() => onChange(o.id)}
            className={`text-[13px] px-4 py-2 rounded-full border transition ${
              active
                ? "border-accent bg-accent-soft text-accent font-semibold"
                : "border-[#ececec] bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
