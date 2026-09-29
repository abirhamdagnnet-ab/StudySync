function Card({ children, className = "", ...props }) {
  return (
    <section className={`rounded-xl border border-slate-200/80 bg-slate-50 shadow-sm ${className}`} {...props}>
      {children}
    </section>
  );
}

export default Card;
