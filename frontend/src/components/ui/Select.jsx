export default function Select({ label, id, value, onChange, opciones, placeholder, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-stone-600 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 transition focus:outline-none focus:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}
