import React, { useState, useEffect } from 'react';

interface EquityChangesProps {
  userId: string;
  isLoading: boolean;
  startDate?: string;
  endDate?: string;
}

interface EquityMovement {
  concepto: string;
  monto: number;
  tipo: 'ingreso' | 'egreso' | 'otro';
}

interface EquityChangesData {
  periodo: {
    inicio: string;
    fin: string;
  };
  patrimonioInicial: number;
  movimientos: EquityMovement[];
  patrimonioFinal: number;
}

const EquityChangesSection: React.FC<EquityChangesProps> = ({
  userId,
  isLoading,
  startDate,
  endDate,
}) => {
  const [equityData, setEquityData] = useState<EquityChangesData | null>(null);
  const [isLoadingEquity, setIsLoadingEquity] = useState(false);
  const [error, setError] = useState('');
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');

  useEffect(() => {
    if (userId) {
      fetchEquityChanges();
    }
  }, [userId]);

  const fetchEquityChanges = async () => {
    setIsLoadingEquity(true);
    setError('');
    try {
      const params = new URLSearchParams({ userId });
      if (localStartDate) params.append('startDate', localStartDate);
      if (localEndDate) params.append('endDate', localEndDate);

      const response = await fetch(`/api/accounting/equity-changes?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error al obtener el estado de cambios en patrimonio');
      }
      const data = await response.json();
      setEquityData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching equity changes:', err);
    } finally {
      setIsLoadingEquity(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoadingEquity || isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-600">Cargando Estado de Cambios en Patrimonio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>{error}</p>
        <button
          onClick={fetchEquityChanges}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!equityData) {
    return (
      <div className="p-6 text-center text-gray-600">
        No hay datos disponibles para el Estado de Cambios en Patrimonio
      </div>
    );
  }

  const totalMovimientos = equityData.movimientos.reduce((sum, m) => sum + m.monto, 0);

  return (
    <div className="w-full p-6 bg-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-center">ESTADO DE CAMBIOS EN PATRIMONIO</h2>
        <p className="text-center text-sm text-gray-600">
          Del {new Date(equityData.periodo.inicio).toLocaleDateString('es-CO')} al{' '}
          {new Date(equityData.periodo.fin).toLocaleDateString('es-CO')}
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
            onClick={fetchEquityChanges}
            className="self-end px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Filtrar
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-3 pl-4">Concepto</th>
                <th className="text-right py-3 pr-4">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-300 bg-blue-50">
                <td className="py-3 pl-4 font-semibold">Patrimonio Inicial</td>
                <td className="text-right py-3 pr-4 font-semibold font-mono">
                  {formatCurrency(equityData.patrimonioInicial)}
                </td>
              </tr>

              {equityData.movimientos.length > 0 ? (
                <>
                  <tr>
                    <td colSpan={2} className="py-2 pl-4 text-gray-700 font-semibold">
                      Movimientos del Período
                    </td>
                  </tr>
                  {equityData.movimientos.map((mov, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-2 pl-8 text-sm">{mov.concepto}</td>
                      <td className={`text-right py-2 pr-4 font-mono text-sm ${
                        mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mov.tipo === 'ingreso' ? '+' : ''}{formatCurrency(mov.monto)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-300 bg-gray-50">
                    <td className="py-2 pl-8 font-semibold">Total Movimientos</td>
                    <td className="text-right py-2 pr-4 font-mono font-semibold">
                      {formatCurrency(totalMovimientos)}
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={2} className="py-3 pl-4 text-gray-500 text-center">
                    Sin movimientos en el período
                  </td>
                </tr>
              )}

              <tr className="border-t-4 border-gray-800 bg-green-50">
                <td className="py-4 pl-4 font-bold text-lg">Patrimonio Final</td>
                <td className="text-right py-4 pr-4 font-bold text-lg font-mono">
                  {formatCurrency(equityData.patrimonioFinal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RESUMEN DE CAMBIOS */}
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h4 className="font-semibold mb-4">Resumen de Cambios</h4>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-gray-600">Patrimonio Inicial</p>
              <p className="font-semibold text-lg">{formatCurrency(equityData.patrimonioInicial)}</p>
            </div>
            <div>
              <p className="text-gray-600">Cambio Neto</p>
              <p className={`font-semibold text-lg ${
                (equityData.patrimonioFinal - equityData.patrimonioInicial) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {formatCurrency(equityData.patrimonioFinal - equityData.patrimonioInicial)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Patrimonio Final</p>
              <p className="font-semibold text-lg">{formatCurrency(equityData.patrimonioFinal)}</p>
            </div>
            <div>
              <p className="text-gray-600">% Cambio</p>
              <p className={`font-semibold text-lg ${
                ((equityData.patrimonioFinal - equityData.patrimonioInicial) /
                  equityData.patrimonioInicial) *
                  100 >=
                0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {equityData.patrimonioInicial !== 0
                  ? (
                      ((equityData.patrimonioFinal - equityData.patrimonioInicial) /
                        equityData.patrimonioInicial) *
                      100
                    ).toFixed(2) + '%'
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquityChangesSection;
