export default function Input({ label, error = false, className = '', id, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-stone-600 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
          error
            ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100'
            : 'border-stone-300 focus-visible:border-brand-400 focus-visible:ring-brand-400'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
