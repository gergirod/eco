type Props = {
  /** La pregunta que la agencia ya se hace — va como H1 */
  question: string;
  /** Una línea de contexto temporal, no explicación del producto */
  when?: string;
};

export default function AgenciaPageHeader({ question, when }: Props) {
  return (
    <header className="mb-8">
      <h1 className="text-[22px] sm:text-[24px] font-semibold text-ink leading-snug tracking-tight">
        {question}
      </h1>
      {when ? <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">{when}</p> : null}
    </header>
  );
}
