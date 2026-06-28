type Props = {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export default function AgenciaStoryStep({
  step,
  title,
  subtitle,
  children,
  className = "",
}: Props) {
  return (
    <section className={`relative pl-11 ${className}`}>
      <div
        className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent text-[12px] font-bold tabular-nums"
        aria-hidden
      >
        {step}
      </div>
      <h2 className="text-[17px] font-semibold text-ink tracking-tight">{title}</h2>
      {subtitle ? (
        <p className="text-[13px] text-gray-500 mt-1 mb-4 leading-relaxed max-w-xl">{subtitle}</p>
      ) : (
        <div className="mt-3" />
      )}
      {children}
    </section>
  );
}
