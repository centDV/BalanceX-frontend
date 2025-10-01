import React, { useState, FormEvent } from 'react';
import type { User } from '../../types/user';
import { v4 as uuidv4 } from 'uuid'; 

interface UserFormModalProps {
  onSave: (user: User) => void;
  isOpen: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ onSave, isOpen }) => {
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
  });

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const newUser: User = {
      id: uuidv4(), 
      ...formData,
    };
    
    onSave(newUser);

    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      companyName: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
          Completa tus Datos
        </h2>
        <form onSubmit={handleSubmit}>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre:</label>
            <input 
              type="text" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido:</label>
            <input 
              type="text" 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Compañía:</label>
            <input 
              type="text" 
              name="companyName" 
              value={formData.companyName} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className='flex justify-center'>
            <button 
            type="submit" 
            className="w-60 bg-blue-1 text-white py-2 px-4 rounded-full hover:bg-blue-2 transition duration-150 ease-in-out font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Guardar y Continuar
          </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;