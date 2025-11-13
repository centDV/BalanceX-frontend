import React, { useState, useEffect } from 'react';

interface Account {
  id: number;
  codigo: string;
  nombre: string;
  naturaleza: string;
  debito: number;
  credito: number;
}

interface TrialBalanceProps {
  userId: string;
  isLoading: boolean;
}

const TrialBalanceSection: React.FC<TrialBalanceProps> = ({ userId, isLoading }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState({ debito: 0, credito: 0 });
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
      
      // Calculate totals
      const totalDebito = data.reduce((sum: number, acc: Account) => sum + (acc.debito || 0), 0);
      const totalCredito = data.reduce((sum: number, acc: Account) => sum + (acc.credito || 0), 0);
      
      setAccounts(data);
      setTotals({ debito: totalDebito, credito: totalCredito });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching trial balance:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const isBalanced = Math.abs(totals.debito - totals.credito) < 0.01;

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
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Código</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Cuenta</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Naturaleza</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Débito</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Crédito</th>
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
                  <td className="px-4 py-3 text-gray-800 font-mono">{account.codigo}</td>
                  <td className="px-4 py-3 text-gray-800">{account.nombre}</td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    <span className="inline-block px-2 py-1 bg-gray-200 rounded text-sm">
                      {account.naturaleza}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800 font-mono">
                    {account.debito > 0 ? account.debito.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800 font-mono">
                    {account.credito > 0 ? account.credito.toFixed(2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-100 border-t-2 border-blue-300 font-bold">
                <td colSpan={3} className="px-4 py-3 text-right text-gray-800">
                  TOTALES:
                </td>
                <td className="px-4 py-3 text-right text-gray-800 font-mono">
                  {totals.debito.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-800 font-mono">
                  {totals.credito.toFixed(2)}
                </td>
              </tr>
              <tr className={`${isBalanced ? 'bg-green-100' : 'bg-red-100'}`}>
                <td colSpan={5} className="px-4 py-3 text-center font-semibold">
                  {isBalanced ? (
                    <span className="text-green-800">✓ Balance correcto (Débito = Crédito)</span>
                  ) : (
                    <span className="text-red-800">✗ Balance incorrecto - Diferencia: {(totals.debito - totals.credito).toFixed(2)}</span>
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
