import React, { useState, useEffect } from 'react';

interface BalanceSheetProps {
  userId: string;
  isLoading: boolean;
}

interface BalanceSheetData {
  fecha: string;
  activoCorriente: BalanceItem[];
  activoNoCorriente: BalanceItem[];
  totalActivoCorriente: number;
  totalActivoNoCorriente: number;
  totalActivo: number;
  pasivoCorriente: BalanceItem[];
  pasivoNoCorriente: BalanceItem[];
  totalPasivoCorriente: number;
  totalPasivoNoCorriente: number;
  totalPasivo: number;
  capitalContable: BalanceItem[];
  totalCapitalContable: number;
  utilidades: number;
  totalPasivoMasCapital: number;
}

interface BalanceItem {
  codigo: string;
  nombre: string;
  saldo: number;
}

const BalanceSheetSection: React.FC<BalanceSheetProps> = ({ userId, isLoading }) => {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchBalanceSheet();
    }
  }, [userId]);

  const fetchBalanceSheet = async () => {
    setIsLoadingSheet(true);
    setError('');
    try {
      const response = await fetch(`/api/accounting/balance-sheet?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Error al obtener el balance general');
      }
      const data = await response.json();
      setBalanceSheet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching balance sheet:', err);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  if (isLoadingSheet || isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-600">Cargando Balance General...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>{error}</p>
        <button
          onClick={fetchBalanceSheet}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!balanceSheet) {
    return (
      <div className="p-6 text-center text-gray-600">
        No hay datos disponibles para el Balance General
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-center">BALANCE GENERAL</h2>
        <p className="text-center text-sm text-gray-600">
          Al {new Date(balanceSheet.fecha).toLocaleDateString('es-CO')}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-50">
              <th colSpan={2} className="px-4 py-3 text-center font-bold text-gray-800 border-b-2 border-gray-300">
                Activo corriente
              </th>
              <th colSpan={2} className="px-4 py-3 text-center font-bold text-gray-800 border-b-2 border-gray-300">
                Pasivo corriente
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Renderizar filas de activo y pasivo corriente en paralelo */}
            {(() => {
              const maxRows = Math.max(
                balanceSheet.activoCorriente?.length || 0,
                balanceSheet.pasivoCorriente?.length || 0
              );
              const rows = [];
              
              for (let i = 0; i < maxRows; i++) {
                const activoItem = balanceSheet.activoCorriente?.[i];
                const pasivoItem = balanceSheet.pasivoCorriente?.[i];
                
                rows.push(
                  <tr key={`corriente-${i}`} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800">
                      {activoItem?.nombre || ''}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-800">
                      {activoItem ? formatCurrency(activoItem.saldo) : ''}
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {pasivoItem?.nombre || ''}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-800">
                      {pasivoItem ? formatCurrency(pasivoItem.saldo) : ''}
                    </td>
                  </tr>
                );
              }
              
              return rows;
            })()}
            
            {/* Separador para Activo No Corriente y Pasivo No Corriente */}
            <tr className="bg-blue-50">
              <th colSpan={2} className="px-4 py-3 text-center font-bold text-gray-800 border-t-2 border-b-2 border-gray-300">
                Activo no corriente
              </th>
              <th colSpan={2} className="px-4 py-3 text-center font-bold text-gray-800 border-t-2 border-b-2 border-gray-300">
                Pasivo no corriente
              </th>
            </tr>
            
            {/* Renderizar filas de activo y pasivo no corriente en paralelo */}
            {(() => {
              const maxRows = Math.max(
                balanceSheet.activoNoCorriente?.length || 0,
                balanceSheet.pasivoNoCorriente?.length || 0
              );
              const rows = [];
              
              for (let i = 0; i < maxRows; i++) {
                const activoItem = balanceSheet.activoNoCorriente?.[i];
                const pasivoItem = balanceSheet.pasivoNoCorriente?.[i];
                
                rows.push(
                  <tr key={`no-corriente-${i}`} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800">
                      {activoItem?.nombre || ''}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-800">
                      {activoItem ? formatCurrency(activoItem.saldo) : ''}
                    </td>
                    <td className="px-4 py-2 text-gray-800">
                      {pasivoItem?.nombre || ''}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-800">
                      {pasivoItem ? formatCurrency(pasivoItem.saldo) : ''}
                    </td>
                  </tr>
                );
              }
              
              return rows;
            })()}
            
            {/* Fila de Utilidades en Pasivo No Corriente - Muestra valor automático del estado de resultados */}
            {balanceSheet.utilidades > 0 && (
              <tr className="border-b hover:bg-gray-50">
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2 text-gray-800 font-semibold">Utilidades</td>
                <td className="px-4 py-2 text-right font-mono text-gray-800 font-semibold">
                  {formatCurrency(balanceSheet.utilidades)}
                </td>
              </tr>
            )}
            
            {/* Separador para Capital Contable */}
            <tr className="bg-blue-50">
              <th colSpan={2} className="px-4 py-3 text-center font-bold text-gray-800 border-t-2 border-b-2 border-gray-300">
              </th>
              <th colSpan={2} className="px-4 py-3 text-center font-bold text-gray-800 border-t-2 border-b-2 border-gray-300">
                Capital Contable
              </th>
            </tr>
            
            {/* Renderizar Capital Contable en columna derecha */}
            {balanceSheet.capitalContable?.map((item, idx) => (
              <tr key={`capital-${idx}`} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2 text-gray-800">{item.nombre}</td>
                <td className="px-4 py-2 text-right font-mono text-gray-800">
                  {formatCurrency(item.saldo)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {/* Fila de totales */}
            <tr className="bg-blue-100 font-bold border-t-2 border-gray-400">
              <td className="px-4 py-3 text-gray-800">Saldo:</td>
              <td className="px-4 py-3 text-right font-mono text-gray-800">
                {formatCurrency(balanceSheet.totalActivo)}
              </td>
              <td className="px-4 py-3 text-gray-800">Saldo:</td>
              <td className="px-4 py-3 text-right font-mono text-gray-800">
                {formatCurrency(balanceSheet.totalPasivoMasCapital)}
              </td>
            </tr>
            
            {/* Validación de balance */}
            {Math.abs(balanceSheet.totalActivo - balanceSheet.totalPasivoMasCapital) > 0.01 && (
              <tr className="bg-red-100">
                <td colSpan={4} className="px-4 py-3 text-center font-semibold text-red-800">
                  ⚠️ Desbalance detectado: {formatCurrency(
                    balanceSheet.totalActivo - balanceSheet.totalPasivoMasCapital
                  )}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      <button
        onClick={fetchBalanceSheet}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
      >
        Actualizar
      </button>
    </div>
  );
};

export default BalanceSheetSection;
