"use client";

import { useId, useState } from "react";

export default function InfoTip({
  text,
  label = "Más información",
}: {
  text: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white text-[10px] font-bold leading-none text-gray-500 hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-[calc(100%+6px)] z-50 w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-[12px] font-normal normal-case leading-relaxed text-gray-600 shadow-lg whitespace-pre-line"
        >
          {text}
        </span>
      )}
    </span>
  );
}
