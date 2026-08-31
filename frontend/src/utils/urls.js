const API_ORIGIN = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return base.replace(/\/api\/?$/, '');
};

export function logoUrl(nombreArchivo) {
  if (!nombreArchivo) return null;
  return `${API_ORIGIN()}/uploads/logos/${nombreArchivo}`;
}
