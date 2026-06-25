import {
  VALUATION_BULLETS,
  VALUATION_CPM,
  VALUATION_CPM_HIGH,
  VALUATION_CPM_LOW,
  VALUATION_NOTICE_TITLE,
} from "@/lib/valuation";

const ITEMS = [
  { label: "Qué es", text: VALUATION_BULLETS.what },
  { label: "Qué medimos", text: VALUATION_BULLETS.measured },
  {
    label: "Cómo se calcula",
    text: `${VALUATION_BULLETS.formula}. CPM de referencia: USD ${VALUATION_CPM_LOW}–${VALUATION_CPM_HIGH} (medio ${VALUATION_CPM}).`,
  },
  { label: "Por qué un rango", text: VALUATION_BULLETS.range },
  { label: "De dónde sale el CPM", text: VALUATION_BULLETS.source },
];

export default function ValuationNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-lg border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-[12px] text-gray-600 leading-relaxed">
        <span className="font-semibold text-gray-800">{VALUATION_NOTICE_TITLE}. </span>
        {VALUATION_BULLETS.what} Mostramos{" "}
        <span className="font-medium text-gray-700">rango estimado</span> (CPM ref. USD{" "}
        {VALUATION_CPM_LOW}–{VALUATION_CPM_HIGH}), no un precio exacto ni lo que pagó la marca.
      </div>
    );
  }

  return (
    <div
      className="card p-5 border-l-4 border-l-amber-400"
      style={{ background: "linear-gradient(180deg,#fffbeb,#ffffff)" }}
    >
      <h2 className="text-[14px] font-semibold text-gray-800 mb-3">{VALUATION_NOTICE_TITLE}</h2>
      <ul className="flex flex-col gap-2.5 text-[12.5px] text-gray-600 leading-relaxed">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex gap-2">
            <span className="shrink-0 font-semibold text-gray-700 min-w-[7.5rem]">{item.label}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
