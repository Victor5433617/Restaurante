import { useRef, useState } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import * as empresaService from '../services/empresaService';
import Card from './ui/Card';
import Button from './ui/Button';

export default function ConfiguracionEmpresa({ empresa, onActualizado }) {
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const subir = async (e) => {
    e.preventDefault();
    if (!archivo) return;
    setSubiendo(true);
    setError('');
    try {
      await empresaService.subirLogo(empresa.id, archivo);
      setArchivo(null);
      if (inputRef.current) inputRef.current.value = '';
      onActualizado();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo subir el logo');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <Card titulo="Logo de la Empresa" icono={ImagePlus}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {empresa.logo_url ? (
          <img
            src={`http://localhost:3000/uploads/logos/${empresa.logo_url}`}
            alt={empresa.nombre}
            className="w-20 h-20 object-contain rounded-xl ring-1 ring-stone-200 bg-white p-1 shrink-0"
          />
        ) : (
          <span className="w-20 h-20 rounded-xl bg-brand-50 ring-1 ring-brand-100 flex items-center justify-center shrink-0">
            <span className="font-display text-3xl font-semibold text-brand-600">
              {empresa.nombre.charAt(0).toUpperCase()}
            </span>
          </span>
        )}

        <form onSubmit={subir} className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="logo-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2 text-sm text-stone-600 transition hover:border-brand-400 hover:text-brand-700"
            >
              <Upload className="w-4 h-4" />
              Elegir imagen
            </label>
            <input
              ref={inputRef}
              id="logo-input"
              type="file"
              accept="image/*"
              onChange={(e) => setArchivo(e.target.files[0])}
              className="sr-only"
            />
            <p className="text-xs text-stone-500 mt-1.5 truncate">
              {archivo ? archivo.name : 'PNG o JPG, preferentemente cuadrado'}
            </p>
          </div>
          <Button type="submit" disabled={!archivo} cargando={subiendo} tamanio="sm" className="shrink-0 self-start sm:self-auto">
            {subiendo ? 'Subiendo...' : 'Subir logo'}
          </Button>
        </form>
      </div>
      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </Card>
  );
}
