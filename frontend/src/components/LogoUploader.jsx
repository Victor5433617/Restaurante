import { useRef, useState } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Alert from './ui/Alert';

export default function LogoUploader({ logoUrl, onSubir, titulo = 'Logo', subtitulo, placeholderLabel }) {
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
      await onSubir(archivo);
      setArchivo(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo subir el logo.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <Card titulo={titulo} subtitulo={subtitulo} icono={ImagePlus}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={titulo}
            className="w-20 h-20 object-contain rounded-xl ring-1 ring-stone-200 bg-white p-1 shrink-0"
          />
        ) : (
          <span className="w-20 h-20 rounded-xl bg-brand-50 ring-1 ring-brand-100 flex items-center justify-center shrink-0">
            {placeholderLabel ? (
              <span className="font-display text-3xl font-semibold text-brand-600">
                {placeholderLabel}
              </span>
            ) : (
              <ImagePlus className="w-8 h-8 text-brand-400" />
            )}
          </span>
        )}

        <form onSubmit={subir} className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="logo-upload-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2 text-sm text-stone-600 transition hover:border-brand-400 hover:text-brand-700"
            >
              <Upload className="w-4 h-4" />
              Elegir imagen
            </label>
            <input
              ref={inputRef}
              id="logo-upload-input"
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
      {error && <Alert tipo="error" className="mt-3">{error}</Alert>}
    </Card>
  );
}
