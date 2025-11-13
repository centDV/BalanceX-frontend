import React, { useState, useEffect } from 'react';

interface BalanceSheetProps {
  userId: string;
  isLoading: boolean;
}

interface BalanceSheetData {
  fecha: string;
  activos: {
    corrientes: BalanceItem[];
    noCorrientes: BalanceItem[];
    totalActivos: number;
  };
  pasivos: {
    corrientes: BalanceItem[];
    noCorrientes: BalanceItem[];
    totalPasivos: number;
  };
  patrimonio: BalanceItem[];
  totalPatrimonio: number;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
    }).format(amount);
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

      <div className="grid grid-cols-2 gap-8">
        {/* ACTIVOS */}
        <div>
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-800 pb-2">ACTIVOS</h3>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3 ml-4">Activos Corrientes</h4>
            {balanceSheet.activos.corrientes.length > 0 ? (
              <div className="ml-4">
                {balanceSheet.activos.corrientes.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-sm">
                    <span className="ml-4">{item.nombre} ({item.codigo})</span>
                    <span className="font-mono">{formatCurrency(item.saldo)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-300 font-semibold">
                  <span className="ml-4">Subtotal Corrientes</span>
                  <span className="font-mono">
                    {formatCurrency(
                      balanceSheet.activos.corrientes.reduce((sum, item) => sum + item.saldo, 0)
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm ml-8">Sin activos corrientes</p>
            )}
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3 ml-4">Activos No Corrientes</h4>
            {balanceSheet.activos.noCorrientes.length > 0 ? (
              <div className="ml-4">
                {balanceSheet.activos.noCorrientes.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-sm">
                    <span className="ml-4">{item.nombre} ({item.codigo})</span>
                    <span className="font-mono">{formatCurrency(item.saldo)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-300 font-semibold">
                  <span className="ml-4">Subtotal No Corrientes</span>
                  <span className="font-mono">
                    {formatCurrency(
                      balanceSheet.activos.noCorrientes.reduce((sum, item) => sum + item.saldo, 0)
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm ml-8">Sin activos no corrientes</p>
            )}
          </div>

          <div className="border-t-4 border-gray-800 pt-4">
            <div className="flex justify-between py-2 font-bold text-lg">
              <span>TOTAL ACTIVOS</span>
              <span className="font-mono">{formatCurrency(balanceSheet.activos.totalActivos)}</span>
            </div>
          </div>
        </div>

        {/* PASIVOS Y PATRIMONIO */}
        <div>
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-800 pb-2">
            PASIVOS Y PATRIMONIO
          </h3>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3 ml-4">Pasivos Corrientes</h4>
            {balanceSheet.pasivos.corrientes.length > 0 ? (
              <div className="ml-4">
                {balanceSheet.pasivos.corrientes.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-sm">
                    <span className="ml-4">{item.nombre} ({item.codigo})</span>
                    <span className="font-mono">{formatCurrency(item.saldo)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-300 font-semibold">
                  <span className="ml-4">Subtotal Corrientes</span>
                  <span className="font-mono">
                    {formatCurrency(
                      balanceSheet.pasivos.corrientes.reduce((sum, item) => sum + item.saldo, 0)
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm ml-8">Sin pasivos corrientes</p>
            )}
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3 ml-4">Pasivos No Corrientes</h4>
            {balanceSheet.pasivos.noCorrientes.length > 0 ? (
              <div className="ml-4">
                {balanceSheet.pasivos.noCorrientes.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-sm">
                    <span className="ml-4">{item.nombre} ({item.codigo})</span>
                    <span className="font-mono">{formatCurrency(item.saldo)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-300 font-semibold">
                  <span className="ml-4">Subtotal No Corrientes</span>
                  <span className="font-mono">
                    {formatCurrency(
                      balanceSheet.pasivos.noCorrientes.reduce((sum, item) => sum + item.saldo, 0)
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm ml-8">Sin pasivos no corrientes</p>
            )}
          </div>

          <div className="mb-6 border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between py-2 font-semibold">
              <span>TOTAL PASIVOS</span>
              <span className="font-mono">{formatCurrency(balanceSheet.pasivos.totalPasivos)}</span>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-3 ml-4">Patrimonio</h4>
            {balanceSheet.patrimonio.length > 0 ? (
              <div className="ml-4">
                {balanceSheet.patrimonio.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-sm">
                    <span className="ml-4">{item.nombre} ({item.codigo})</span>
                    <span className="font-mono">{formatCurrency(item.saldo)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm ml-8">Sin cuentas de patrimonio</p>
            )}
          </div>

          <div className="border-t-4 border-gray-800 pt-4">
            <div className="flex justify-between py-2 font-bold text-lg">
              <span>TOTAL PASIVOS + PATRIMONIO</span>
              <span className="font-mono">
                {formatCurrency(balanceSheet.pasivos.totalPasivos + balanceSheet.totalPatrimonio)}
              </span>
            </div>
          </div>

          {Math.abs(
            balanceSheet.activos.totalActivos -
              (balanceSheet.pasivos.totalPasivos + balanceSheet.totalPatrimonio)
          ) > 0.01 && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded text-sm">
              ⚠️ Desbalance detectado: {formatCurrency(
                balanceSheet.activos.totalActivos -
                  (balanceSheet.pasivos.totalPasivos + balanceSheet.totalPatrimonio)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceSheetSection;
