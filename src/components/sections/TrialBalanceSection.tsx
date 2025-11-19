import React, { useState, useEffect } from 'react';

interface Account {
  id: number;
  codigo: string;
  nombre: string;
  naturaleza: string;
  movimiento_deudor: number;
  movimiento_acreedor: number;
  saldo_deudor: number;
  saldo_acreedor: number;
}

interface TrialBalanceProps {
  userId: string;
  isLoading: boolean;
}

const TrialBalanceSection: React.FC<TrialBalanceProps> = ({ userId, isLoading }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState({ 
    movimiento_deudor: 0, 
    movimiento_acreedor: 0, 
    saldo_deudor: 0, 
    saldo_acreedor: 0 
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrialBalance();
  }, [userId]);

  const fetchTrialBalance = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      const response = await fetch(`/api/accounting/trial-balance/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener el balance de comprobación');
      }

      const data = await response.json();
      
      // Convert string values to numbers, calculate saldos, and filter accounts with funds
      const parsedData = data
        .map((acc: any) => {
          const movDeudor = parseFloat(acc.debito) || 0;
          const movAcreedor = parseFloat(acc.credito) || 0;
          const diferencia = movDeudor - movAcreedor;
          
          return {
            ...acc,
            movimiento_deudor: movDeudor,
            movimiento_acreedor: movAcreedor,
            saldo_deudor: diferencia > 0 ? diferencia : 0,
            saldo_acreedor: diferencia < 0 ? Math.abs(diferencia) : 0,
          };
        })
        .filter((acc: Account) => acc.movimiento_deudor > 0 || acc.movimiento_acreedor > 0);
      
      // Calculate totals
      const totals = parsedData.reduce(
        (sums: { movimiento_deudor: number; movimiento_acreedor: number; saldo_deudor: number; saldo_acreedor: number }, acc: Account) => ({
          movimiento_deudor: sums.movimiento_deudor + acc.movimiento_deudor,
          movimiento_acreedor: sums.movimiento_acreedor + acc.movimiento_acreedor,
          saldo_deudor: sums.saldo_deudor + acc.saldo_deudor,
          saldo_acreedor: sums.saldo_acreedor + acc.saldo_acreedor,
        }),
        { movimiento_deudor: 0, movimiento_acreedor: 0, saldo_deudor: 0, saldo_acreedor: 0 }
      );
      
      setAccounts(parsedData);
      setTotals(totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching trial balance:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const isBalanced = 
    Math.abs(totals.movimiento_deudor - totals.movimiento_acreedor) < 0.01 &&
    Math.abs(totals.saldo_deudor - totals.saldo_acreedor) < 0.01;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Balance de Comprobación</h1>
      <p className="text-gray-600 mb-6">Saldos de todas las cuentas</p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {dataLoading || isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Cargando balance de comprobación...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay movimientos registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-50 border-b-2 border-blue-200">
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 border-r">Código</th>
                <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 border-r">Concepto<br/>Cuenta</th>
                <th colSpan={2} className="px-4 py-2 text-center font-semibold text-gray-700 border-r">Movimientos</th>
                <th colSpan={2} className="px-4 py-2 text-center font-semibold text-gray-700">Saldos</th>
              </tr>
              <tr className="bg-blue-50 border-b-2 border-blue-200">
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Deudor</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700 border-r">Acreedor</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Deudor</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Acreedor</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account, index) => (
                <tr
                  key={account.id}
                  className={`border-b ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-blue-50 transition-colors`}
                >
                  <td className="px-4 py-3 text-gray-800 font-mono border-r">{account.codigo}</td>
                  <td className="px-4 py-3 text-gray-800 border-r">{account.nombre}</td>
                  <td className="px-4 py-3 text-right text-gray-800 font-mono">
                    {account.movimiento_deudor > 0 ? `$${account.movimiento_deudor.toFixed(2)}` : '$0.00'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800 font-mono border-r">
                    {account.movimiento_acreedor > 0 ? `$${account.movimiento_acreedor.toFixed(2)}` : '$0.00'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800 font-mono">
                    {account.saldo_deudor > 0 ? `$${account.saldo_deudor.toFixed(2)}` : '$0.00'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800 font-mono">
                    {account.saldo_acreedor > 0 ? `$${account.saldo_acreedor.toFixed(2)}` : '$0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-100 border-t-2 border-blue-300 font-bold">
                <td colSpan={2} className="px-4 py-3 text-right text-gray-800 border-r">
                  TOTALES:
                </td>
                <td className="px-4 py-3 text-right text-gray-800 font-mono">
                  ${totals.movimiento_deudor.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-800 font-mono border-r">
                  ${totals.movimiento_acreedor.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-800 font-mono">
                  ${totals.saldo_deudor.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-800 font-mono">
                  ${totals.saldo_acreedor.toFixed(2)}
                </td>
              </tr>
              <tr className={`${isBalanced ? 'bg-green-100' : 'bg-red-100'}`}>
                <td colSpan={6} className="px-4 py-3 text-center font-semibold">
                  {isBalanced ? (
                    <span className="text-green-800">✓ Balance correcto</span>
                  ) : (
                    <span className="text-red-800">✗ Balance incorrecto</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <button
        onClick={fetchTrialBalance}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
      >
        Actualizar
      </button>
    </div>
  );
};

export default TrialBalanceSection;
