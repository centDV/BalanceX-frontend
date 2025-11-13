import React, { useState, useEffect } from 'react';

interface CashFlowProps {
  userId: string;
  isLoading: boolean;
  startDate?: string;
  endDate?: string;
}

interface CashFlowActivity {
  concepto: string;
  monto: number;
}

interface CashFlowData {
  periodo: {
    inicio: string;
    fin: string;
  };
  saldoInicial: number;
  actividades: {
    operacionales: CashFlowActivity[];
    totalOperacionales: number;
    inversión: CashFlowActivity[];
    totalInversion: number;
    financiamiento: CashFlowActivity[];
    totalFinanciamiento: number;
  };
  saldoFinal: number;
}

const CashFlowSection: React.FC<CashFlowProps> = ({
  userId,
  isLoading,
  startDate,
  endDate,
}) => {
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);
  const [isLoadingCashFlow, setIsLoadingCashFlow] = useState(false);
  const [error, setError] = useState('');
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');

  useEffect(() => {
    if (userId) {
      fetchCashFlow();
    }
  }, [userId]);

  const fetchCashFlow = async () => {
    setIsLoadingCashFlow(true);
    setError('');
    try {
      const params = new URLSearchParams({ userId });
      if (localStartDate) params.append('startDate', localStartDate);
      if (localEndDate) params.append('endDate', localEndDate);

      const response = await fetch(`/api/accounting/cash-flow?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error al obtener el estado de flujos de caja');
      }
      const data = await response.json();
      setCashFlow(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching cash flow:', err);
    } finally {
      setIsLoadingCashFlow(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoadingCashFlow || isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-600">Cargando Estado de Flujos de Caja...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>{error}</p>
        <button
          onClick={fetchCashFlow}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!cashFlow) {
    return (
      <div className="p-6 text-center text-gray-600">
        No hay datos disponibles para el Estado de Flujos de Caja
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-center">ESTADO DE FLUJOS DE CAJA</h2>
        <p className="text-center text-sm text-gray-600">
          Del {new Date(cashFlow.periodo.inicio).toLocaleDateString('es-CO')} al{' '}
          {new Date(cashFlow.periodo.fin).toLocaleDateString('es-CO')}
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
            onClick={fetchCashFlow}
            className="self-end px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Filtrar
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <div className="flex justify-between">
            <span className="font-semibold">Saldo Inicial de Caja:</span>
            <span className="font-mono font-semibold">{formatCurrency(cashFlow.saldoInicial)}</span>
          </div>
        </div>

        {/* ACTIVIDADES OPERACIONALES */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 border-b-2 border-gray-800 pb-2">
            A. Flujos de Actividades Operacionales
          </h3>
          {cashFlow.actividades.operacionales.length > 0 ? (
            <div>
              {cashFlow.actividades.operacionales.map((act, idx) => (
                <div key={idx} className="flex justify-between py-2 text-sm">
                  <span className="ml-4">{act.concepto}</span>
                  <span className="font-mono">{formatCurrency(act.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 mt-2 border-t border-gray-300 font-semibold bg-gray-50">
                <span>Flujo Neto de Actividades Operacionales</span>
                <span className="font-mono">{formatCurrency(cashFlow.actividades.totalOperacionales)}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm ml-8">Sin actividades operacionales</p>
          )}
        </div>

        {/* ACTIVIDADES DE INVERSIÓN */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 border-b-2 border-gray-800 pb-2">
            B. Flujos de Actividades de Inversión
          </h3>
          {cashFlow.actividades.inversión.length > 0 ? (
            <div>
              {cashFlow.actividades.inversión.map((act, idx) => (
                <div key={idx} className="flex justify-between py-2 text-sm">
                  <span className="ml-4">{act.concepto}</span>
                  <span className="font-mono">{formatCurrency(act.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 mt-2 border-t border-gray-300 font-semibold bg-gray-50">
                <span>Flujo Neto de Actividades de Inversión</span>
                <span className="font-mono">{formatCurrency(cashFlow.actividades.totalInversion)}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm ml-8">Sin actividades de inversión</p>
          )}
        </div>

        {/* ACTIVIDADES DE FINANCIAMIENTO */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 border-b-2 border-gray-800 pb-2">
            C. Flujos de Actividades de Financiamiento
          </h3>
          {cashFlow.actividades.financiamiento.length > 0 ? (
            <div>
              {cashFlow.actividades.financiamiento.map((act, idx) => (
                <div key={idx} className="flex justify-between py-2 text-sm">
                  <span className="ml-4">{act.concepto}</span>
                  <span className="font-mono">{formatCurrency(act.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 mt-2 border-t border-gray-300 font-semibold bg-gray-50">
                <span>Flujo Neto de Actividades de Financiamiento</span>
                <span className="font-mono">
                  {formatCurrency(cashFlow.actividades.totalFinanciamiento)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm ml-8">Sin actividades de financiamiento</p>
          )}
        </div>

        {/* RESUMEN */}
        <div className="p-4 bg-gray-100 rounded mb-6">
          <div className="mb-3 pb-3 border-b">
            <div className="flex justify-between">
              <span>Flujo Neto del Período:</span>
              <span className="font-mono font-semibold">
                {formatCurrency(
                  cashFlow.actividades.totalOperacionales +
                    cashFlow.actividades.totalInversion +
                    cashFlow.actividades.totalFinanciamiento
                )}
              </span>
            </div>
          </div>
          <div className="flex justify-between mb-3">
            <span>+ Saldo Inicial de Caja:</span>
            <span className="font-mono font-semibold">{formatCurrency(cashFlow.saldoInicial)}</span>
          </div>
        </div>

        {/* SALDO FINAL */}
        <div className="border-t-4 border-gray-800 pt-4">
          <div
            className={`flex justify-between py-3 font-bold text-lg ${
              cashFlow.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span>SALDO FINAL DE CAJA</span>
            <span className="font-mono">{formatCurrency(cashFlow.saldoFinal)}</span>
          </div>
        </div>

        {cashFlow.saldoFinal < 0 && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded text-sm">
            ⚠️ Advertencia: Saldo negativo de caja. Posible insolvencia de liquidez.
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowSection;
