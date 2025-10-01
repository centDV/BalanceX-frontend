import { useState, useCallback } from 'react';
import type { NewAsientoData } from '../types/journal'; 

const API_JOURNAL_URL = 'http://localhost:3001/api/accounting/journal';

interface UseJournalResult {
  isLoadingJournal: boolean;
  fetchJournal: (userId: string) => Promise<NewAsientoData[]>; 
  saveAsiento: (data: NewAsientoData, userId: string) => Promise<boolean>;
  deleteAsiento: (asientoId: number, userId: string) => Promise<boolean>;
}

export const useJournal = (): UseJournalResult => {
  const [isLoadingJournal, setLoading] = useState(false);

  const fetchJournal = useCallback(async (userId: string): Promise<NewAsientoData[]> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_JOURNAL_URL}/${userId}`);
      if (!response.ok) throw new Error("Fallo al obtener los asientos");
      return await response.json();
    } catch (error: any) {
      console.error("Error fetching journal:", error.message);
      alert(`Error al obtener los asientos: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAsiento = useCallback(async (data: NewAsientoData, userId: string): Promise<boolean> => {
    if (isLoadingJournal) return false;
    setLoading(true);
    try {
      const response = await fetch(API_JOURNAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId }),
      });
      if (!response.ok) throw new Error("Fallo al registrar el asiento.");
      alert("Asiento registrado exitosamente.");
      return true;
    } catch (error: any) {
      console.error("Error saving asiento:", error.message);
      alert(`Error al registrar asiento: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isLoadingJournal]);

  const deleteAsiento = useCallback(async (asientoId: number): Promise<boolean> => {
    if (isLoadingJournal) return false;
    setLoading(true);
    try {
      const response = await fetch(`${API_JOURNAL_URL}/${asientoId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Fallo al eliminar el asiento.");
      alert("Asiento eliminado exitosamente.");
      return true;
    } catch (error: any) {
      console.error("Error eliminando asiento:", error.message);
      alert(`Error al eliminar asiento: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isLoadingJournal]);

  return { isLoadingJournal, fetchJournal, saveAsiento, deleteAsiento };
};
