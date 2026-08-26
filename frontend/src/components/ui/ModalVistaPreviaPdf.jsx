import { X, Download } from 'lucide-react';
import Button from './Button';

export default function ModalVistaPreviaPdf({ url, nombreArchivo, onCerrar }) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-50 bg-espresso-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 shrink-0">
          <h2 className="text-sm font-semibold text-stone-800">Vista previa del reporte</h2>
          <div className="flex items-center gap-2">
            <a href={url} download={nombreArchivo}>
              <Button tamanio="sm">
                <Download className="w-4 h-4" />
                Descargar PDF
              </Button>
            </a>
            <button
              onClick={onCerrar}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
        <iframe title="Vista previa del PDF" src={url} className="flex-1 w-full" />
      </div>
    </div>
  );
}
