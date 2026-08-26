import { Loader2 } from 'lucide-react';

const VARIANTES = {
  primario: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
  secundario: 'bg-white hover:bg-stone-50 border border-stone-300 text-stone-700',
  fantasma: 'text-brand-700 hover:bg-brand-50',
  peligro: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
};

const TAMANIOS = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-3 text-sm',
};

export default function Button({
  variante = 'primario',
  tamanio = 'md',
  cargando = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variante]} ${TAMANIOS[tamanio]} ${className}`}
      {...props}
    >
      {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
