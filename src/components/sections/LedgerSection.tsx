import React, { useState, useCallback, useMemo } from 'react';
import type { LedgerEntry } from '../../hooks/useAccounting'; 

type AccountMovement = {
    fecha: string;
    referencia: string | null;
    descripcion: string;
    debito: number;
    credito: number;
    cuenta_afectada_codigo?: string;
    cuenta_afectada_nombre?: string;
};
type AccountMovementsMap = {
    [cuentaId: number]: AccountMovement[];
};

type AccountMovementWithBalance = AccountMovement & { 
    saldo_acumulado: number;
    saldo_es_normal: boolean;
};

interface LedgerSectionProps {
    ledger: LedgerEntry[];
    isLoading: boolean;
    onLedgerize: () => Promise<void>; 
    fetchLedger: () => Promise<void>;
    userId: string; 
    fetchAccountMovements: (userId: string, accountId: number) => Promise<AccountMovement[]>;
}

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (e) {
        return dateString;
    }
};

const LedgerSection: React.FC<LedgerSectionProps> = ({ 
    ledger, 
    isLoading, 
    onLedgerize, 
    fetchLedger,
    userId,
    fetchAccountMovements,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [expandedAccountId, setExpandedAccountId] = useState<number | null>(null);
    const [movements, setMovements] = useState<AccountMovementsMap>({});
    const [isFetchingMovements, setIsFetchingMovements] = useState(false);
    
    const [filterText, setFilterText] = useState('');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 2 
        }).format(amount);
    };

    const handleLedgerize = async () => {
        if (isProcessing || isLoading) return;

        const isConfirmed = window.confirm(
            "¿Está seguro de que desea MAYORIZAR las cuentas? Esta acción actualizará todos los saldos basados en los asientos del Libro Diario."
        );

        if (isConfirmed) {
            setIsProcessing(true);
            try {
                await onLedgerize(); 
                await fetchLedger(); 
                setExpandedAccountId(null);
                setMovements({});
            } catch (error) {
                console.error("Fallo la mayorización:", error);
            } finally {
                setIsProcessing(false);
            }
        }
    };
    
    const filteredLedger = useMemo(() => {
        if (!filterText) {
            return ledger;
        }

        const lowerCaseFilter = filterText.toLowerCase();

        return ledger.filter(entry => 
            entry.codigo.toLowerCase().includes(lowerCaseFilter) ||
            entry.nombre.toLowerCase().includes(lowerCaseFilter)
        );
    }, [ledger, filterText]);


    const calculateRunningBalance = useCallback((
        movements: AccountMovement[], 
        naturaleza: 'D' | 'C'
    ): AccountMovementWithBalance[] => {
        let currentBalance = 0; 
        
        return movements.map(move => {
            if (naturaleza === 'D') {
                currentBalance += move.debito;
                currentBalance -= move.credito;
            } else { 
                currentBalance += move.credito;
                currentBalance -= move.debito;
            }

            const saldo_es_normal = currentBalance >= 0;
            
            return {
                ...move,
                saldo_acumulado: currentBalance,
                saldo_es_normal: saldo_es_normal,
            };
        });
    }, []);

    const toggleMovements = useCallback(async (accountId: number) => {
        if (expandedAccountId === accountId) {
            setExpandedAccountId(null);
            return;
        }

        setExpandedAccountId(accountId);
        
        if (movements[accountId]) {
            return;
        }

        setIsFetchingMovements(true);
        try {
            const data = await fetchAccountMovements(userId, accountId); 
            setMovements(prev => ({ ...prev, [accountId]: data }));
        } catch (error) {
            console.error('Error al cargar movimientos:', error);
            alert('Error al cargar los movimientos de la cuenta.');
            setExpandedAccountId(null); 
        } finally {
            setIsFetchingMovements(false);
        }
    }, [expandedAccountId, movements, userId, fetchAccountMovements]);

    const isButtonDisabled = isLoading || isProcessing || isFetchingMovements;
    const buttonText = isProcessing ? 'Mayorizando...' : 'Mayorizar Cuentas';

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Libro Mayor</h1>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-4 bg-white rounded-xl shadow-md space-y-4 sm:space-y-0">
                <div className='flex flex-col space-y-2 w-full sm:w-1/2'>
                    <p className="text-gray-600 max-w-md">
                        Calcula y consolida los saldos finales de cada cuenta (incluyendo cuentas mayores) basado en el Libro Diario.
                    </p>
                    <input
                        type="text"
                        placeholder="Filtrar por Código o Nombre..."
                        value={filterText}
                        onChange={(e) => {
                            setFilterText(e.target.value);
                            setExpandedAccountId(null); // Ocultar movimientos al filtrar
                        }}
                        className="p-2 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
                <div className="flex space-x-3 mt-4 sm:mt-0">
                    <button
                        onClick={handleLedgerize}
                        disabled={isButtonDisabled}
                        className={`px-6 py-2 rounded-lg font-semibold transition shadow-lg
                            ${isButtonDisabled 
                                ? 'bg-blue-300 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                            }`}
                    >
                        {buttonText}
                    </button>
                    <button
                        onClick={fetchLedger}
                        disabled={isButtonDisabled}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                    >
                        Refrescar Saldo
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="text-center py-8 text-xl text-blue-600">Cargando saldos...</div>
            )}
            
            {/* 4. Usar la lista filtrada */}
            {filteredLedger.length > 0 && !isLoading && (
                <div className="bg-white rounded-xl shadow-xl overflow-x-auto mt-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de la Cuenta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naturaleza</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Final</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredLedger.map((entry) => (
                                <React.Fragment key={entry.cuenta_id}>
                                    <tr className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-700">{entry.codigo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${entry.naturaleza === 'D' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                            >
                                                {entry.naturaleza === 'D' ? 'DEUDORA' : 'ACREEDORA'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">
                                            {formatCurrency(entry.saldo_actual)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => toggleMovements(entry.cuenta_id)}
                                                disabled={isFetchingMovements}
                                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium disabled:opacity-50"
                                            >
                                                {expandedAccountId === entry.cuenta_id ? '➖ Ocultar' : '➕ Ver Mayor'}
                                            </button>
                                        </td>
                                    </tr>

                                    {expandedAccountId === entry.cuenta_id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={5} className="p-0 border-t border-gray-300">
                                                <h3 className="text-md font-semibold p-4 bg-gray-100 text-gray-700 border-b">
                                                    Libro Mayor Detallado: {entry.codigo} - {entry.nombre}
                                                </h3>
                                                {isFetchingMovements && <div className="p-4 text-center text-gray-500">Cargando movimientos...</div>}
                                                
                                                {movements[entry.cuenta_id] && movements[entry.cuenta_id].length > 0 ? (
                                                    <table className="min-w-full text-sm">
                                                        <thead className="bg-gray-50 border-b">
                                                            <tr>
                                                                <th className="px-6 py-2 text-left w-1/12">Fecha</th>
                                                                <th className="px-6 py-2 text-left w-1/12">Ref. Asiento</th>
                                                                {/* Nueva columna para la cuenta real afectada */}
                                                                <th className="px-6 py-2 text-left w-2/12">Cuenta Afectada</th> 
                                                                <th className="px-6 py-2 text-left w-2/12">Descripción del Movimiento</th>
                                                                <th className="px-6 py-2 text-right w-2/12 text-green-700">DEBE</th>
                                                                <th className="px-6 py-2 text-right w-2/12 text-red-700">HABER</th>
                                                                <th className="px-6 py-2 text-right w-2/12 font-bold">SALDO</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {calculateRunningBalance(movements[entry.cuenta_id], entry.naturaleza).map((move, i) => (
                                                                <tr key={i} className="hover:bg-white">
                                                                    <td className="px-6 py-2 whitespace-nowrap">{formatDate(move.fecha)}</td>
                                                                    <td className="px-6 py-2 whitespace-nowrap font-medium text-blue-600">{move.referencia || 'N/A'}</td>
                                                                    {/* Mostrar la cuenta de detalle si existe, o la cuenta principal */}
                                                                    <td className="px-6 py-2 text-gray-700">
                                                                        {move.cuenta_afectada_codigo && move.cuenta_afectada_nombre 
                                                                            ? `${move.cuenta_afectada_codigo} - ${move.cuenta_afectada_nombre}`
                                                                            : `${entry.codigo} - ${entry.nombre}`}
                                                                    </td>
                                                                    <td className="px-6 py-2 text-gray-600">{move.descripcion}</td>
                                                                    <td className="px-6 py-2 text-right font-mono text-green-700">{move.debito > 0 ? formatCurrency(move.debito) : ''}</td>
                                                                    <td className="px-6 py-2 text-right font-mono text-red-700">{move.credito > 0 ? formatCurrency(move.credito) : ''}</td>
                                                                    <td 
                                                                        className="px-6 py-2 text-right font-extrabold" 
                                                                        style={{ color: move.saldo_es_normal ? 'green' : 'red' }}
                                                                    >
                                                                        {formatCurrency(Math.abs(move.saldo_acumulado))}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="border-t-2 border-blue-500 font-bold bg-blue-50">
                                                                <td colSpan={6} className="px-6 py-2 text-right">SALDO FINAL (Según Mayorización)</td>
                                                                <td 
                                                                    className="px-6 py-2 text-right text-lg" 
                                                                    style={{ color: (entry.naturaleza === 'D' && entry.saldo_actual >= 0) || (entry.naturaleza === 'C' && entry.saldo_actual >= 0) ? 'green' : 'red' }}
                                                                >
                                                                    {formatCurrency(Math.abs(entry.saldo_actual))}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="p-4 text-center text-gray-500">
                                                        Esta cuenta no ha tenido movimientos en el Libro Diario.
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredLedger.length === 0 && !isLoading && ledger.length > 0 && (
                <div className="text-center py-8 text-xl text-gray-500">
                    No se encontraron cuentas con el filtro "{filterText}".
                </div>
            )}
        </div>
    );
};

export default LedgerSection;