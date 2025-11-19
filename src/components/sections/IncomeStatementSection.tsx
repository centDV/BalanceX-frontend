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
  ventasTotales: number;
  devolucionSobreVenta: number;
  ventasNetas: number;
  compras: number;
  gastosDeCompra: number;
  comprasTotales: number;
  devolucionSobreCompra: number;
  comprasNetas: number;
  inventarioInicial: number;
  mercanciaDisponible: number;
  inventarioFinal: number;
  costoDeVenta: number;
  utilidadBruta: number;
  gastosDeOperacion: number;
  utilidadOperacional: number;
  detalle?: {
    ventasTotales?: number;
    devolucionSobreVenta?: number;
    compras?: number;
    gastosDeCompra?: number;
    devolucionSobreCompra?: number;
    inventarioInicial?: number;
    inventarioFinal?: number;
    gastosDeOperacion?: Array<{ id: number; codigo: string; nombre: string; monto: number }>;
  };
}

interface CuentaOption {
  id: number;
  codigo: string;
  nombre: string;
  naturaleza: string;
}

interface SelectionsState {
  ventasTotales?: number;
  devolucionSobreVenta?: number;
  compras?: number;
  gastosDeCompra?: number;
  devolucionSobreCompra?: number;
  inventarioInicial?: number;
  inventarioFinal?: number;
  gastosDeOperacion?: number[]; // permitir múltiples
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
  const [cuentas, setCuentas] = useState<CuentaOption[]>([]);
  const [selections, setSelections] = useState<SelectionsState>({ gastosDeOperacion: [] });
  const [gastoToAdd, setGastoToAdd] = useState<string>('');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAccounts();
    }
  }, [userId]);

  // Auto-calcular una vez que se cargan las cuentas y aún no hay estado
  useEffect(() => {
    const loadPrefsAndCalc = async () => {
      try {
        // Prefetch preferencias guardadas
        const params = new URLSearchParams({ userId });
        const resp = await fetch(`/api/accounting/income-statement/preferences?${params.toString()}`);
        if (resp.ok) {
          const data = await resp.json();
          const saved = data?.selections || {};
          setSelections((prev) => ({ gastosDeOperacion: [], ...prev, ...saved }));
        }
      } catch (_) {}
      finally {
        // Calcular con lo disponible
        if (!statement && !isLoadingStatement) {
          fetchCustomIncomeStatement();
        }
      }
    };
    if (userId && cuentas.length > 0 && !statement && !isLoadingStatement) {
      loadPrefsAndCalc();
    }
  }, [userId, cuentas, statement, isLoadingStatement]);

  const fetchAccounts = async () => {
    if (!userId) return;
    setIsLoadingAccounts(true);
    try {
      const params = new URLSearchParams({ userId });
      const resp = await fetch(`/api/accounting/income-statement/accounts?${params.toString()}`);
      if (!resp.ok) throw new Error('Error al obtener cuentas');
      const data = await resp.json();
      setCuentas(data.cuentas || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Eliminado modo automático: solo cálculo personalizado

  const fetchCustomIncomeStatement = async () => {
    setIsLoadingStatement(true);
    setError('');
    try {
      const body = {
        userId,
        startDate: localStartDate || undefined,
        endDate: localEndDate || undefined,
        selections: selections,
      };
      const resp = await fetch('/api/accounting/income-statement/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error('Error al calcular estado personalizado');
      const data = await resp.json();
      setStatement(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setIsLoadingStatement(false);
    }
  };

  const fetchCustomIncomeStatementImmediate = async (currentSelections: SelectionsState) => {
    setIsLoadingStatement(true);
    try {
      const body = {
        userId,
        startDate: localStartDate || undefined,
        endDate: localEndDate || undefined,
        selections: currentSelections,
      };
      const resp = await fetch('/api/accounting/income-statement/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error('Error al calcular estado personalizado');
      const data = await resp.json();
      setStatement(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  const handleSelect = (field: keyof SelectionsState, value: string) => {
    if (field === 'gastosDeOperacion') {
      // handled via Add button
      return;
    } else {
      setSelections((prev) => ({ ...prev, [field]: value ? parseInt(value) : undefined }));
    }
  };

  const renderCuentaSelect = (field: keyof SelectionsState, multiple = false) => {
    if (isLoadingAccounts) return <span className="text-xs text-gray-500">Cargando cuentas...</span>;
    return (
      <select
        multiple={multiple}
        value={multiple ? (selections[field] as number[] | undefined)?.map(String) || [] : selections[field] ? String(selections[field]) : ''}
        onChange={(e) => {
          if (multiple) {
            // For multiple select we toggle selected option
            handleSelect(field, e.target.value);
          } else {
            handleSelect(field, e.target.value);
          }
        }}
        className="border rounded px-2 py-1 text-sm w-full"
      >
        {!multiple && <option value="">-- Seleccionar cuenta --</option>}
        {cuentas.map((c) => (
          <option key={c.id} value={c.id}>
            {c.codigo} - {c.nombre}
          </option>
        ))}
      </select>
    );
  };

  const addGastoOperacion = () => {
    const id = parseInt(gastoToAdd);
    if (!id || Number.isNaN(id)) return;
    setSelections((prev) => {
      const arr = prev.gastosDeOperacion || [];
      if (arr.includes(id)) return prev;
      const updated = { ...prev, gastosDeOperacion: [...arr, id] };
      fetchCustomIncomeStatementImmediate(updated);
      return updated;
    });
    setGastoToAdd('');
  };

  const removeGastoOperacion = (id: number) => {
    setSelections((prev) => {
      const updated = {
        ...prev,
        gastosDeOperacion: (prev.gastosDeOperacion || []).filter((x) => x !== id),
      };
      fetchCustomIncomeStatementImmediate(updated);
      return updated;
    });
  };

  // Recalcular al cambiar cualquier selección (con pequeño debounce)
  const [debounceId, setDebounceId] = useState<number | null>(null);
  useEffect(() => {
    if (!userId) return;
    if (!cuentas.length) return;
    if (!statement && isLoadingStatement) return;
    if (debounceId) window.clearTimeout(debounceId);
    const id = window.setTimeout(() => {
      fetchCustomIncomeStatement();
    }, 300);
    setDebounceId(id);
    return () => window.clearTimeout(id);
  }, [selections, localStartDate, localEndDate]);

  const formatCurrency = (amount: number | undefined) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  if ((isLoadingStatement || isLoading) && !statement) {
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
          onClick={fetchCustomIncomeStatement}
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
          Del {localStartDate || statement.periodo?.inicio || 'N/A'} al {localEndDate || statement.periodo?.fin || 'N/A'}
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
          <div className="flex flex-col gap-2">
            <button
              onClick={fetchCustomIncomeStatement}
              className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Calcular
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto border border-gray-300">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="text-left px-4 py-3 font-bold text-lg" colSpan={2}>Estado de resultados</th>
            </tr>
          </thead>
          <tbody>
            {/* Ventas */}
            <tr className="border-t align-top">
              <td className="px-4 py-2">Ventas totales
                <div className="mt-2">{renderCuentaSelect('ventasTotales')}</div>
              </td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.ventasTotales)}</td>
            </tr>
            <tr className="align-top">
              <td className="px-4 py-2">(-) Devolución sobre venta
                <div className="mt-2">{renderCuentaSelect('devolucionSobreVenta')}</div>
              </td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.devolucionSobreVenta)}</td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2">(=) Ventas netas</td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.ventasNetas)}</td>
            </tr>

            {/* Compras */}
            <tr className="border-t align-top">
              <td className="px-4 py-2">Compras
                <div className="mt-2">{renderCuentaSelect('compras')}</div>
              </td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.compras)}</td>
            </tr>
            <tr className="align-top">
              <td className="px-4 py-2">(+) Gastos de compra
                <div className="mt-2">{renderCuentaSelect('gastosDeCompra')}</div>
              </td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.gastosDeCompra)}</td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2">(=) Compras totales</td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.comprasTotales)}</td>
            </tr>
            <tr className="align-top">
              <td className="px-4 py-2">(-) Devolución sobre compra
                <div className="mt-2">{renderCuentaSelect('devolucionSobreCompra')}</div>
              </td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.devolucionSobreCompra)}</td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2">(=) Compras netas</td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.comprasNetas)}</td>
            </tr>

            {/* Inventarios */}
            <tr className="border-t align-top">
              <td className="px-4 py-2">(+) Inventario inicial
                <div className="mt-2">{renderCuentaSelect('inventarioInicial')}</div>
                <p className="text-xs text-gray-500 mt-1">Usa el primer asiento de la cuenta seleccionada.</p>
              </td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.inventarioInicial)}</td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2">(=) Mercancía disponible</td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.mercanciaDisponible)}</td>
            </tr>
            <tr className="align-top">
              <td className="px-4 py-2">(-) Inventario final
                <div className="mt-2">{renderCuentaSelect('inventarioFinal')}</div>
              </td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.inventarioFinal)}</td>
            </tr>

            {/* Costo de venta */}
            <tr className="bg-blue-50 font-bold border-t-2">
              <td className="px-4 py-3">Costo de venta</td>
              <td className="px-4 py-3 text-right font-mono">{formatCurrency(statement.costoDeVenta)}</td>
            </tr>

            {/* Utilidad bruta */}
            <tr className="bg-green-50 font-bold border-t-2">
              <td className="px-4 py-3">Utilidad bruta</td>
              <td className="px-4 py-3 text-right font-mono">{formatCurrency(statement.utilidadBruta)}</td>
            </tr>

            {/* Gastos de operación */}
            <tr className="border-t align-top">
              <td className="px-4 py-2">(-) Gastos de operación
                <div className="mt-2 flex gap-2 items-center">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={gastoToAdd}
                    onChange={(e) => setGastoToAdd(e.target.value)}
                  >
                    <option value="">-- Seleccionar cuenta --</option>
                    {cuentas.map((c) => (
                      <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addGastoOperacion}
                    className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800"
                  >
                    Agregar
                  </button>
                </div>
                {(selections.gastosDeOperacion || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selections.gastosDeOperacion || []).map((id) => {
                      const acct = cuentas.find((c) => c.id === id);
                      const monto = statement?.detalle?.gastosDeOperacion?.find((g) => g.id === id)?.monto || 0;
                      return (
                        <span key={id} className="inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                          {acct ? `${acct.codigo} - ${acct.nombre}` : id} · {formatCurrency(monto)}
                          <button
                            type="button"
                            onClick={() => removeGastoOperacion(id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </td>
              <td className="px-4 py-2 text-right font-mono">{formatCurrency(statement.gastosDeOperacion)}</td>
            </tr>

            {/* Utilidad operacional */}
            <tr className={`font-bold border-t-2 ${statement.utilidadOperacional >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <td className="px-4 py-3">(=) Utilidad operacional / antes de impuestos</td>
              <td className="px-4 py-3 text-right font-mono">{formatCurrency(statement.utilidadOperacional)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncomeStatementSection;
