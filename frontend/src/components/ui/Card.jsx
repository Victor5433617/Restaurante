export default function Card({ titulo, subtitulo, icono: Icono, acciones, className = '', children }) {
  return (
    <section className={`bg-white rounded-xl border border-stone-200 shadow-sm ${className}`}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icono && (
              <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <Icono className="w-[18px] h-[18px]" />
              </span>
            )}
            <div className="min-w-0">
              {titulo && (
                <h2 className="font-display font-semibold text-stone-800 leading-tight">{titulo}</h2>
              )}
              {subtitulo && <p className="text-xs text-stone-500 mt-0.5">{subtitulo}</p>}
            </div>
          </div>
          {acciones && <div className="flex items-center gap-2">{acciones}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

