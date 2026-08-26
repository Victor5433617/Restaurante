const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const DIAS_INICIALES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SAB'];

export const fechaISO = (valor) => {
  const texto = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

export const hoyISO = () => fechaISO(new Date());

export const sumarDias = (fecha, n) => {
  const d = new Date(fecha);
  d.setDate(d.getDate() + n);
  return d;
};

export const lunesDe = (fecha) => {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const dia = d.getDay();
  d.setDate(d.getDate() + (dia === 0 ? -6 : 1 - dia));
  return d;
};

export const formatoCorto = (valor) => {
  const iso = fechaISO(valor);
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

export const formatoLargo = (valor) => {
  const base = valor instanceof Date ? valor : new Date(`${fechaISO(valor)}T12:00:00`);
  if (Number.isNaN(base.getTime())) return '';
  const texto = base.toLocaleDateString('es-PY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export const etiquetaSemana = (desde, hasta) => {
  const mismoMes = desde.getMonth() === hasta.getMonth();
  const ini = mismoMes
    ? String(desde.getDate())
    : `${desde.getDate()} de ${MESES[desde.getMonth()]}`;
  return `Semana del ${ini} al ${hasta.getDate()} de ${MESES[hasta.getMonth()]}`;
};
