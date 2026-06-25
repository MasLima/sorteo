import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmModal({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className={danger ? 'text-red-500' : 'text-yellow-500'} />
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1">
            <X size={14} /> {cancelLabel || 'Cancelar'}
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded flex items-center gap-1 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}