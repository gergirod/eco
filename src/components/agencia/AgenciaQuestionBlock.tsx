type Props = {
  question: string;
  children: React.ReactNode;
  className?: string;
};

/** Sección autoexplicativa: el título ES la pregunta de la agencia. Sin pasos ni subtítulos meta. */
export default function AgenciaQuestionBlock({ question, children, className = "" }: Props) {
  return (
    <section className={`space-y-4 ${className}`}>
      <h2 className="text-[18px] font-semibold text-ink tracking-tight leading-snug">{question}</h2>
      {children}
    </section>
  );
}
