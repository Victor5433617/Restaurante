import { Inbox } from 'lucide-react';

export default function EmptyState({ icono: Icono = Inbox, mensaje, children }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
      <Icono className="w-8 h-8" />
      <p className="text-sm">{mensaje}</p>
      {children}
    </div>
  );
}
