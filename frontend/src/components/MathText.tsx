/** Renders text with fractions like "3/4" stacked the way children see them in books. */
export function MathText({ text }: { text: string }) {
  const parts = text.split(/(\d+\/\d+)/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = /^(\d+)\/(\d+)$/.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        return (
          <span key={i} className="frac" aria-label={`${m[1]} ส่วน ${m[2]}`}>
            <span className="num">{m[1]}</span>
            <span className="den">{m[2]}</span>
          </span>
        );
      })}
    </>
  );
}
