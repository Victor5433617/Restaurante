export default function PageHeader({ icono: Icono, titulo, subtitulo, acciones, className = '' }) {
  return (
    <header className={`flex flex-wrap items-end justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        {Icono && (
          <span className="w-11 h-11 rounded-xl bg-espresso-900 text-brand-300 flex items-center justify-center shrink-0 shadow-sm">
            <Icono className="w-5 h-5" />
          </span>
        )}
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-900 leading-tight">{titulo}</h1>
          {subtitulo && <p className="text-sm text-stone-500 mt-0.5">{subtitulo}</p>}
        </div>
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  );
}
