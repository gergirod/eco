"use client";

import type { ChannelProfileTabId } from "./tabs";
import { CHANNEL_PROFILE_TABS } from "./tabs";

type Props = {
  active: ChannelProfileTabId;
  onSelect: (id: ChannelProfileTabId) => void;
};

export default function ChannelProfileTabBar({ active, onSelect }: Props) {
  return (
    <div className="flex gap-2 mb-6 border-b border-[#ececec] pb-3 overflow-x-auto scrollbar-none">
      {CHANNEL_PROFILE_TABS.map((t) => (
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
