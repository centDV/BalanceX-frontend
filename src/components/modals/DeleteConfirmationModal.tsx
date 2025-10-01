import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-red-900 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-red-600 border-b pb-2">
          ⚠️ Confirmar Eliminación de Datos
        </h2>
        <p className="mb-6 text-gray-700">
          ¿Estás absolutamente seguro de que deseas eliminar tu usuario y **TODOS** tus datos contables asociados (Asientos, Catálogo, Mayor)?
        </p>
        <p className="mb-6 font-semibold text-red-700">
          Esta acción es irreversible.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Sí, Borrar Permanentemente
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;