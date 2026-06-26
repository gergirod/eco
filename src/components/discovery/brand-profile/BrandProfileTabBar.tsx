"use client";

import type { BrandProfileTabId } from "./tabs";
import { BRAND_PROFILE_TABS } from "./tabs";

type Props = {
  active: BrandProfileTabId;
  onSelect: (id: BrandProfileTabId) => void;
  /** Ocultar tabs que no aplican en vista acotada a un canal. */
  hideTabIds?: BrandProfileTabId[];
};

export default function BrandProfileTabBar({ active, onSelect, hideTabIds = [] }: Props) {
  const hidden = new Set(hideTabIds);
  const tabs = BRAND_PROFILE_TABS.filter((t) => !hidden.has(t.id));

  return (
    <div className="flex gap-2 mb-6 border-b border-[#ececec] pb-3 overflow-x-auto scrollbar-none">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          className={`px-3.5 py-2 rounded-lg text-[13px] border whitespace-nowrap transition shrink-0 ${
            active === t.id
              ? "bg-accent-soft border-accent text-accent font-medium"
              : "bg-white border-[#ececec] text-gray-600 hover:bg-gray-50"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
