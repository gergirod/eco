"use client";

import type { BrandProfileTabId } from "./tabs";
import { BRAND_PROFILE_TABS } from "./tabs";

type Props = {
  active: BrandProfileTabId;
  onSelect: (id: BrandProfileTabId) => void;
};

export default function BrandProfileTabBar({ active, onSelect }: Props) {
  return (
    <div className="flex gap-2 mb-6 border-b border-[#ececec] pb-3 overflow-x-auto scrollbar-none">
      {BRAND_PROFILE_TABS.map((t) => (
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
