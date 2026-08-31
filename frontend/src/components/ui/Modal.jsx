import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const TAMANIOS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function Modal({ abierto, onCerrar, titulo, tamanio = 'md', children }) {
  const contenidoRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [abierto, onCerrar]);

  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-espresso-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        ref={contenidoRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`bg-white rounded-2xl shadow-xl w-full ${TAMANIOS[tamanio]} p-6 space-y-4 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">{titulo}</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

