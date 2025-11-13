import React, { useState, useEffect } from 'react';

interface IncomeStatementProps {
  userId: string;
  isLoading: boolean;
  startDate?: string;
  endDate?: string;
}

interface IncomeStatementData {
  periodo: {
    inicio: string;
    fin: string;
  };
  ingresos: IncomeItem[];
  totalIngresos: number;
  gastos: {
    operacionales: IncomeItem[];
    noOperacionales: IncomeItem[];
  };
  totalGastos: number;
  utilidadNeta: number;
}

interface IncomeItem {
  codigo: string;
  nombre: string;
  monto: number;
}

const IncomeStatementSection: React.FC<IncomeStatementProps> = ({
  userId,
  isLoading,
  startDate,
  endDate,
}) => {
  const [statement, setStatement] = useState<IncomeStatementData | null>(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [error, setError] = useState('');
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');

  useEffect(() => {
    if (userId) {
      fetchIncomeStatement();
    }
  }, [userId]);

  const fetchIncomeStatement = async () => {
    setIsLoadingStatement(true);
    setError('');
    try {
      const params = new URLSearchParams({ userId });
      if (localStartDate) params.append('startDate', localStartDate);
      if (localEndDate) params.append('endDate', localEndDate);

      const response = await fetch(`/api/accounting/income-statement?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error al obtener el estado de resultados');
      }
      const data = await response.json();
      setStatement(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching income statement:', err);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoadingStatement || isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-600">Cargando Estado de Resultados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>{error}</p>
        <button
          onClick={fetchIncomeStatement}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="p-6 text-center text-gray-600">
        No hay datos disponibles para el Estado de Resultados
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-center">ESTADO DE RESULTADOS</h2>
        <p className="text-center text-sm text-gray-600">
          Del {new Date(statement.periodo.inicio).toLocaleDateString('es-CO')} al{' '}
          {new Date(statement.periodo.fin).toLocaleDateString('es-CO')}
        </p>

        <div className="mt-4 flex justify-center gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha Inicio:</label>
            <input
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              className="px-3 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fecha Fin:</label>
            <input
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              className="px-3 py-1 border rounded"
            />
          </div>
          <button
            onClick={fetchIncomeStatement}
            className="self-end px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Filtrar
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* INGRESOS */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 border-b-2 border-gray-800 pb-2">INGRESOS</h3>
          {statement.ingresos.length > 0 ? (
            <div>
              {statement.ingresos.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 text-sm">
                  <span className="ml-4">{item.nombre} ({item.codigo})</span>
                  <span className="font-mono">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 mt-2 border-t border-gray-300 font-semibold">
                <span>Total Ingresos</span>
                <span className="font-mono">{formatCurrency(statement.totalIngresos)}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm ml-8">Sin ingresos registrados</p>
          )}
        </div>

        {/* GASTOS */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 border-b-2 border-gray-800 pb-2">GASTOS</h3>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3 ml-4">Gastos Operacionales</h4>
            {statement.gastos.operacionales.length > 0 ? (
              <div className="ml-4">
                {statement.gastos.operacionales.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-sm">
                    <span className="ml-4">{item.nombre} ({item.codigo})</span>
                    <span className="font-mono">{formatCurrency(item.monto)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-300 font-semibold">
                  <span className="ml-4">Subtotal Operacionales</span>
                  <span className="font-mono">
                    {formatCurrency(
                      statement.gastos.operacionales.reduce((sum, item) => sum + item.monto, 0)
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm ml-8">Sin gastos operacionales</p>
            )}
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3 ml-4">Gastos No Operacionales</h4>
            {statement.gastos.noOperacionales.length > 0 ? (
              <div className="ml-4">
                {statement.gastos.noOperacionales.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-sm">
                    <span className="ml-4">{item.nombre} ({item.codigo})</span>
                    <span className="font-mono">{formatCurrency(item.monto)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 mt-2 border-t border-gray-300 font-semibold">
                  <span className="ml-4">Subtotal No Operacionales</span>
                  <span className="font-mono">
                    {formatCurrency(
                      statement.gastos.noOperacionales.reduce((sum, item) => sum + item.monto, 0)
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm ml-8">Sin gastos no operacionales</p>
            )}
          </div>

          <div className="flex justify-between py-3 font-semibold border-t border-gray-300">
            <span>Total Gastos</span>
            <span className="font-mono">{formatCurrency(statement.totalGastos)}</span>
          </div>
        </div>

        {/* UTILIDAD NETA */}
        <div className="border-t-4 border-gray-800 pt-4">
          <div
            className={`flex justify-between py-3 font-bold text-lg ${
              statement.utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span>UTILIDAD NETA</span>
            <span className="font-mono">{formatCurrency(statement.utilidadNeta)}</span>
          </div>
        </div>

        {/* INDICADORES */}
        {statement.totalIngresos > 0 && (
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h4 className="font-semibold mb-3">Indicadores</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Margen Neto:</p>
                <p className="font-semibold">
                  {(
                    ((statement.utilidadNeta / statement.totalIngresos) * 100)
                  ).toFixed(2)}
                  %
                </p>
              </div>
              <div>
                <p className="text-gray-600">Razón Gastos/Ingresos:</p>
                <p className="font-semibold">
                  {(
                    ((statement.totalGastos / statement.totalIngresos) * 100)
                  ).toFixed(2)}
                  %
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeStatementSection;
