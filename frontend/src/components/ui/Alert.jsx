import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const TIPOS = {
  error: { icono: AlertCircle, clases: 'bg-red-50 text-red-700 ring-red-100' },
  exito: { icono: CheckCircle2, clases: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  aviso: { icono: AlertTriangle, clases: 'bg-amber-50 text-amber-800 ring-amber-100' },
  info: { icono: Info, clases: 'bg-sky-50 text-sky-700 ring-sky-100' },
};

export default function Alert({ tipo = 'info', className = '', children }) {
  if (!children) return null;
  const { icono: Icono, clases } = TIPOS[tipo];
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm ring-1 ring-inset ${clases} ${className}`}
    >
      <Icono className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
