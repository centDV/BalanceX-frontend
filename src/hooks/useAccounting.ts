import { useState, useCallback } from 'react';
import type { Account, NewAccountData } from '../types/account';

const API_LEDGER_URL = '/api/accounting/ledger';
const API_CATALOG_URL = '/api/accounting/catalog';
const API_CATALOG_IMPORT_URL = '/api/accounting/catalog/import';
const API_LEDGERIZE_URL = '/api/accounting/ledgerize';
const API_ACCOUNT_MOVEMENTS_URL = '/api/accounting/account-movements';

export interface LedgerEntry {
    cuenta_id: number;
    codigo: string; 
    nombre: string; 
    naturaleza: 'D' | 'C';
    saldo_actual: number;
    ultima_mayorizacion: string;
}

export interface AccountMovement {
    fecha: string;
    referencia: string | null;
    descripcion: string; 
    debito: number;
    credito: number;
}

interface AccountingHookResult {
    catalog: Account[];
    ledger: LedgerEntry[]; 
    isLoadingCatalog: boolean;
    isLoadingLedger: boolean; 
    fetchCatalog: (userId: string | undefined) => Promise<void>;
    addAccount: (data: NewAccountData, userId: string | undefined) => Promise<boolean>;
    updateAccount: (accountId: number, data: NewAccountData, userId: string | undefined) => Promise<boolean>;
    importAccounts: (accounts: any[], userId: string | undefined) => Promise<any>;
    deleteAccount: (accountId: number, userId: string | undefined) => Promise<boolean>;
    ledgerize: (userId: string | undefined) => Promise<boolean>; 
    fetchLedger: (userId: string | undefined) => Promise<void>;
    fetchAccountMovements: (userId: string | undefined, accountId: number) => Promise<AccountMovement[]>;
}

export const useAccounting = (): AccountingHookResult => {
    const [catalog, setCatalog] = useState<Account[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
    const [isLoadingLedger, setIsLoadingLedger] = useState(false);

    const fetchCatalog = useCallback(async (userId: string | undefined) => {
        if (!userId) {
            setCatalog([]); 
            return;
        }

        if (isLoadingCatalog) {
            console.warn('fetchCatalog ignorado: ya hay una carga en proceso.');
            return;
        }

        setIsLoadingCatalog(true);
        try {
            const response = await fetch(`${API_CATALOG_URL}?userId=${userId}`);
            
            if (!response.ok) {
                let errorMessage = `Error HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch {
                    errorMessage = response.statusText || 'Error desconocido del servidor.';
                }
                throw new Error(errorMessage);
            }
            
            const contentLength = response.headers.get('content-length');
            if (contentLength === '0' || !contentLength) {
                setCatalog([]);
                return;
            }

            const data: Account[] = await response.json();

            if (Array.isArray(data)) {
                setCatalog(data);
            } else {
                console.warn('API devolvió datos que no son un array, se asigna arreglo vacío.');
                setCatalog([]);
            }
            
        } catch (error: any) {
            console.error('Error fetching catalog:', error.message);
            setCatalog([]); 
            alert(`Error al cargar el catálogo: ${error.message}`);
        } finally {
            setIsLoadingCatalog(false);
        }
    }, [isLoadingCatalog]); 

    

    const fetchLedger = useCallback(async (userId: string | undefined) => {
        if (!userId) {
            setLedger([]); 
            return;
        }

        setIsLoadingLedger(true);
        try {
            const response = await fetch(`${API_LEDGER_URL}?userId=${userId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al cargar el libro mayor.');
            }
            
            const data: LedgerEntry[] = await response.json();
            if (Array.isArray(data)) {
                setLedger(data);
            } else {
                setLedger([]);
            }
        } catch (error: any) {
            console.error('Error fetching ledger:', error.message);
            setLedger([]);
            alert(`Error al cargar el libro mayor: ${error.message}`);
        } finally {
            setIsLoadingLedger(false);
        }
    }, []); 

    const fetchAccountMovements = useCallback(async (userId: string | undefined, accountId: number): Promise<AccountMovement[]> => {
        if (!userId) {
            console.error('ID de usuario no proporcionado.');
            return [];
        }
        
        try {
            // Nota: Se requiere que el backend ordene estos movimientos por fecha ascendente
            const response = await fetch(`${API_ACCOUNT_MOVEMENTS_URL}?userId=${userId}&accountId=${accountId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error al cargar movimientos de la cuenta ${accountId}.`);
            }
            
            const data: AccountMovement[] = await response.json();
            
            if (Array.isArray(data)) {
                return data;
            } else {
                console.warn('API devolvió datos que no son un array de movimientos.');
                return [];
            }
        } catch (error: any) {
            console.error('Error fetching account movements:', error.message);
            throw error; // Propagar el error para que el componente lo maneje
        }
    }, []);


    const ledgerize = useCallback(async (userId: string | undefined): Promise<boolean> => {
        if (!userId) return false;

        setIsLoadingLedger(true);
        try {
            const response = await fetch(API_LEDGERIZE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fallo al mayorizar las cuentas.');
            }
            
            await fetchLedger(userId); 
            alert('Mayorización completada exitosamente.');
            return true;
        } catch (error: any) {
            console.error('Error mayorizando:', error.message);
            alert(`Error al mayorizar: ${error.message}`);
            return false;
        } finally {
            setIsLoadingLedger(false);
        }
    }, [fetchLedger]); 

    const addAccount = useCallback(async (data: NewAccountData, userId: string | undefined): Promise<boolean> => {
        if (!userId) return false;

        if (isLoadingCatalog) {
            console.warn('addAccount ignorado: ya hay una carga en proceso.');
            return false;
        }

        setIsLoadingCatalog(true);
        try {
            const payload = { ...data, userId: userId };
            
            const response = await fetch(API_CATALOG_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fallo al crear la cuenta.');
            }

            await fetchCatalog(userId); 
            return true;
            
        } catch (error: any) {
            console.error('Error adding account:', error.message);
            alert(`Error al agregar cuenta: ${error.message}`);
            return false;
        } finally {
            setIsLoadingCatalog(false);
        }
    }, [isLoadingCatalog, fetchCatalog]); 

    const deleteAccount = useCallback(async (accountId: number, userId: string | undefined): Promise<boolean> => {
        if (!userId) return false;

        if (isLoadingCatalog) {
            console.warn('deleteAccount ignorado: ya hay una carga en proceso.');
            return false;
        }

        setIsLoadingCatalog(true);
        try {
            const url = `${API_CATALOG_URL}/${accountId}?userId=${userId}`;
            
            const response = await fetch(url, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fallo al eliminar la cuenta.');
            }

            await fetchCatalog(userId); 
            return true;
            
        } catch (error: any) {
            console.error('Error deleting account:', error.message);
            alert(`Error al eliminar cuenta: ${error.message}`);
            return false;
        } finally {
            setIsLoadingCatalog(false);
        }
    }, [isLoadingCatalog, fetchCatalog]);

    const updateAccount = useCallback(async (accountId: number, data: NewAccountData, userId: string | undefined): Promise<boolean> => {
        if (!userId) return false;

        if (isLoadingCatalog) {
            console.warn('updateAccount ignorado: ya hay una carga en proceso.');
            return false;
        }

        setIsLoadingCatalog(true);
        try {
            const payload = { ...data, userId: userId };
            
            const response = await fetch(`${API_CATALOG_URL}/${accountId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fallo al actualizar la cuenta.');
            }

            await fetchCatalog(userId); 
            return true;
            
        } catch (error: any) {
            console.error('Error updating account:', error.message);
            alert(`Error al actualizar cuenta: ${error.message}`);
            return false;
        } finally {
            setIsLoadingCatalog(false);
        }
    }, [isLoadingCatalog, fetchCatalog]);

    return {
        catalog,
        ledger, 
        isLoadingCatalog,
        isLoadingLedger, 
        fetchCatalog,
        fetchLedger, 
        addAccount,
        updateAccount,
        importAccounts: async (accounts: any[], userId: string | undefined) => {
            if (!userId) return { insertedCount: 0, skippedCount: 0, failures: [{ reason: 'userId requerido' }] };

            if (isLoadingCatalog) {
                console.warn('importAccounts ignorado: ya hay una carga en proceso.');
                return { insertedCount: 0, skippedCount: 0, failures: [{ reason: 'Carga en proceso' }] };
            }

            try {
                const response = await fetch(`${API_CATALOG_IMPORT_URL}?userId=${userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(accounts),
                });

                if (!response.ok) {
                    // Try to parse JSON error, otherwise read text/plain or HTML
                    const contentType = response.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        const err = await response.json();
                        throw new Error(err.error || 'Fallo al importar catálogo');
                    } else {
                        const text = await response.text();
                        // Likely HTML (e.g. dev server index.html) or plain text
                        throw new Error(`Fallo al importar catálogo: servidor respondió con contenido no JSON:\n${text.slice(0, 1000)}`);
                    }
                }

                const contentType = response.headers.get('content-type') || '';
                let data: any;
                if (contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    throw new Error(`Respuesta inesperada del servidor (no JSON): ${text.slice(0, 1000)}`);
                }
                // refresh catalog after successful import
                await fetchCatalog(userId);
                return data;
            } catch (error: any) {
                console.error('Error importando catálogo:', error.message);
                alert(`Error al importar catálogo: ${error.message}`);
                return { insertedCount: 0, skippedCount: 0, failures: [{ reason: error.message }] };
            }
        },
        deleteAccount,
        ledgerize,
        fetchAccountMovements, 
    };
};