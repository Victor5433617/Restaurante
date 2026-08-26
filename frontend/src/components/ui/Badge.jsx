const COLORES = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  verde: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ambar: 'bg-amber-50 text-amber-800 ring-amber-200',
  rojo: 'bg-red-50 text-red-700 ring-red-200',
  azul: 'bg-sky-50 text-sky-700 ring-sky-200',
  neutro: 'bg-stone-100 text-stone-600 ring-stone-200',
};

export default function Badge({ color = 'neutro', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COLORES[color]} ${className}`}
    >
      {children}
    </span>
  );
}
