import { useState, useEffect } from 'react';
import type { User } from '../types/user'; 

const LOCAL_STORAGE_KEY = 'currentUser';
const API_URL = 'http://localhost:3001/api/user/save';
const API_DELETE_BASE_URL = 'http://localhost:3001/api/user/'; 

interface UserHookResult {
  user: User | null;
  isModalOpen: boolean;
  isLoading: boolean;
  handleSaveUser: (newUser: User) => Promise<void>;
  deleteUserAndReload: () => Promise<void>;
}

export const useUserData = (): UserHookResult => {
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setIsModalOpen(true);
    }
    setIsLoading(false);
  }, []);

  const handleSaveUser = async (newUser: User) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error desconocido al guardar el usuario.');
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
      
      setUser(newUser);
      setIsModalOpen(false);

    } catch (error: any) {
      console.error('Fallo al guardar en el servidor:', error.message);
      alert(`Error al guardar: ${error.message}`); 
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUserAndReload = async () => {
    if (!user || !user.id) {
        alert("No hay un usuario para eliminar.");
        return;
    }

    setIsLoading(true);
    try {
        const response = await fetch(`${API_DELETE_BASE_URL}${user.id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error desconocido al eliminar el usuario.');
        }

        localStorage.removeItem(LOCAL_STORAGE_KEY);
        
        window.location.reload(); 

    } catch (error: any) {
        console.error('Fallo al eliminar en el servidor:', error.message);
        alert(`Error al eliminar los datos: ${error.message}`); 
    } finally {
        if (window.location.hash !== '') setIsLoading(false); 
    }
  };

  return {
    user,
    isModalOpen,
    isLoading,
    handleSaveUser,
    deleteUserAndReload,
  };
};
