"use client";
import { useState, useRef, useEffect } from "react";

export default function BrandPicker({
  options,
  value,
  onChange,
}: {
  options: { slug: string; name: string; mentions: number }[];
  value: string;
  onChange: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const sel = options.find((o) => o.slug === value);
  const filtered = options
    .filter((o) => o.name.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 40);

  return (
    <div className="relative" ref={ref}>
      <button className="btn btn-ghost min-w-[220px] justify-between" onClick={() => setOpen((o) => !o)}>
        <span className="font-medium">{sel ? sel.name : "Elegí una marca"}</span>
        <span className="text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-[280px] card shadow-lg p-2 max-h-[340px] overflow-auto">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar marca…"
            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg mb-1 outline-none focus:border-accent"
          />
          {filtered.map((o) => (
            <button
              key={o.slug}
              onClick={() => {
                onChange(o.slug);
                setOpen(false);
                setQ("");
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-[13px] flex justify-between items-center hover:bg-gray-50 ${
                o.slug === value ? "bg-accent-soft text-accent" : ""
              }`}
            >
              <span>{o.name}</span>
              <span className="text-[11px] text-gray-400">{o.mentions}</span>
            </button>
          ))}
          {!filtered.length && <div className="px-3 py-3 text-[12px] text-gray-400">Sin resultados</div>}
        </div>
      )}
    </div>
  );
}
