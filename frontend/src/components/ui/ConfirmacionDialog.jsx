import Modal from './Modal';
import Button from './Button';

export default function ConfirmacionDialog({ abierto, onCerrar, onConfirmar, titulo, mensaje, textoConfirmar = 'Eliminar', cargando = false }) {
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo} tamanio="sm">
      <p className="text-sm text-stone-600">{mensaje}</p>
      <div className="flex justify-end gap-2 pt-2">
        <Button variante="secundario" tamanio="sm" onClick={onCerrar} disabled={cargando}>
          Cancelar
        </Button>
        <Button variante="peligro" tamanio="sm" onClick={onConfirmar} cargando={cargando}>
          {textoConfirmar}
        </Button>
      </div>
    </Modal>
  );
}
