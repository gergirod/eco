type Props = {
  text: string;
  className?: string;
};

/** Cobertura scoped a canal, marca o programa — debajo del hero de detalle. */
export default function EntityCoverageLine({ text, className = "" }: Props) {
  return (
    <p
      className={`text-[12.5px] text-gray-500 mb-6 leading-relaxed ${className}`.trim()}
      aria-label="Cobertura de esta entidad en el período"
    >
      {text}
    </p>
  );
}
