import React, { useState, useEffect } from 'react';
import type { NewAccountData, Account } from '../../types/account';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewAccountData) => Promise<boolean>;
  catalog: Account[];
  accountToEdit?: Account | null;
}

const initialData: NewAccountData = {
  codigo: '',
  nombre: '',
  naturaleza: 'D',
  esCuentaMayor: true,
  parent_id: null,
};

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onSave, catalog, accountToEdit }) => {
  const [formData, setFormData] = useState<NewAccountData>(initialData);

  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        setFormData({
          codigo: accountToEdit.codigo,
          nombre: accountToEdit.nombre,
          naturaleza: accountToEdit.naturaleza,
          esCuentaMayor: accountToEdit.es_cuenta_mayor,
          parent_id: accountToEdit.parent_id,
        });
      } else {
        setFormData(initialData);
      }
    }
  }, [isOpen, accountToEdit]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | boolean | number | null = value;

    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    if (name === 'parent_id') {
      finalValue = value === '' ? null : Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue as any,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSave(formData);
    if (success) {
      setFormData(initialData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-40 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-blue-800 border-b pb-2">
          {accountToEdit ? 'Editar Cuenta Contable' : 'Agregar Nueva Cuenta Contable'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Código</label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de la Cuenta</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Naturaleza</label>
            <select
              name="naturaleza"
              value={formData.naturaleza}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="D">Deudora (Débito)</option>
              <option value="C">Acreedora (Crédito)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cuenta Padre (opcional)</label>
            <select
              name="parent_id" 
              value={formData.parent_id ?? ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="0">-- Ninguna (Cuenta raíz) --</option>
              {catalog
                .filter(acc => acc.es_cuenta_mayor)
                .map(acc => (
                  <option 
                    key={acc.id} 
                    value={acc.id} 
                  >
                    {acc.codigo} - {acc.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="esCuentaMayor"
              checked={formData.esCuentaMayor}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="text-sm font-medium text-gray-700">
              Cuenta de Detalle/Movimiento
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Guardar Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;