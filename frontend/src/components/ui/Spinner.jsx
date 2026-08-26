import { Loader2 } from 'lucide-react';

export default function Spinner({ texto = 'Cargando...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-14 text-stone-500 ${className}`}>
      <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
      {texto && <p className="text-sm">{texto}</p>}
    </div>
  );
}
