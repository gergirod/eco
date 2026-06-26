"use client";

import channelsFile from "@/data/channels.json";

type ChannelRow = {
  id: string;
  name: string;
  has_data?: boolean;
  enabled?: boolean;
};

const channels = (channelsFile as ChannelRow[])
  .filter((c) => c.enabled !== false)
  .sort((a, b) => {
    if (a.has_data !== b.has_data) return a.has_data ? -1 : 1;
    return a.name.localeCompare(b.name, "es");
  });

type Props = {
  channelId: string;
  benchmarkIds: string[];
  onChannelId: (id: string) => void;
  onBenchmarkIds: (ids: string[]) => void;
};

export default function ChannelContractPicker({
  channelId,
  benchmarkIds,
  onChannelId,
  onBenchmarkIds,
}: Props) {
  function toggleBenchmark(id: string) {
    if (id === channelId) return;
    if (benchmarkIds.includes(id)) {
      onBenchmarkIds(benchmarkIds.filter((x) => x !== id));
    } else {
      onBenchmarkIds([...benchmarkIds, id]);
    }
  }

  return (
    <div className="sm:col-span-2 space-y-4">
      <label className="block text-[12px] text-gray-600">
        Canal principal
        <select
          value={channelId}
          onChange={(e) => {
            const id = e.target.value;
            onChannelId(id);
            onBenchmarkIds(benchmarkIds.filter((x) => x !== id));
          }}
          className="mt-1 w-full px-3 py-2 border border-[#ececec] rounded-lg text-[13px] bg-white"
          required
        >
          <option value="">Elegí un canal…</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {!c.has_data ? " (sin data aún)" : ""}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="text-[12px] text-gray-600 mb-2">Benchmark (opcional)</div>
        <div className="flex flex-wrap gap-2">
          {channels
            .filter((c) => c.id !== channelId)
            .map((c) => {
              const on = benchmarkIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleBenchmark(c.id)}
                  className={`text-[12px] px-3 py-1.5 rounded-full border transition ${
                    on
                      ? "bg-accent-soft border-accent text-accent font-medium"
                      : "border-[#ececec] text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
