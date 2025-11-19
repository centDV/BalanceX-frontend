import React, { useState, useMemo, useEffect } from 'react';
import type { NewAsientoData, JournalLine } from '../../types/journal';
import type { Account, AccountNature } from '../../types/account'; 

interface JournalLineWithNature extends JournalLine {
  naturaleza: AccountNature | null; 
}

interface AsientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewAsientoData) => Promise<boolean>;
  catalog: Account[];
}

const initialLine: JournalLineWithNature = {
  tempKey: Date.now().toString(),
  cuenta_id: null,
  codigo: '',
  nombre: '',
  naturaleza: null, 
  debito: 0.00,
  credito: 0.00,
};

const AsientoModal: React.FC<AsientoModalProps> = ({ isOpen, onClose, onSave, catalog }) => {
  const [fecha, setFecha] = useState(new Date().toISOString().substring(0, 10));
  const [descripcion, setDescripcion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [lines, setLines] = useState<JournalLineWithNature[]>([{ ...initialLine }]);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const defaultIvaRate = 0.13; // Tasa por defecto (13%)
  const [ivaRate, setIvaRate] = useState(defaultIvaRate);
  const [baseAmount, setBaseAmount] = useState(0.00);
  const [ivaCalculationType, setIvaCalculationType] = useState<'added' | 'included'>('added');
  
  // --- Valores Calculados ---
  const { calculatedIva, calculatedGross, calculatedNet } = useMemo(() => {
    let iva = 0;
    let net = 0;
    let gross = 0;
    const rate = ivaRate;
    const amount = baseAmount;
    
    if (amount > 0) {
      if (ivaCalculationType === 'added') {
        // IVA Añadido (Monto Base = Neto)
        net = amount;
        iva = amount * rate;
        gross = net + iva;
      } else {
        // IVA Incluido (Monto Base = Bruto)
        gross = amount;
        net = gross / (1 + rate);
        iva = gross - net;
      }
    }

    return { 
      calculatedIva: parseFloat(iva.toFixed(2)), 
      calculatedGross: parseFloat(gross.toFixed(2)),
      calculatedNet: parseFloat(net.toFixed(2)),
    };
  }, [baseAmount, ivaRate, ivaCalculationType]);
  
  // --- Hooks de Efecto y Utilidad ---

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFecha(new Date().toISOString().substring(0, 10));
    setDescripcion('');
    setReferencia('');
    setLines([{ ...initialLine }]);
    setValidationError('');
    // Reset IVA Calculator
    setBaseAmount(0.00);
    setIvaRate(defaultIvaRate);
    setIvaCalculationType('added');
  };

  const accountsForSelect = useMemo(() => {
    // Mostrar todas las cuentas (incluye cuentas mayores y de detalle)
    return catalog.slice();
  }, [catalog]);

  const totalDebito = lines.reduce((sum, line) => sum + line.debito, 0);
  const totalCredito = lines.reduce((sum, line) => sum + line.credito, 0);
  const isBalanced = totalDebito.toFixed(2) === totalCredito.toFixed(2) && (totalDebito > 0 || totalCredito === 0);
  const balanceDifference = Math.abs(totalDebito - totalCredito);
  const validLineCount = lines.filter(l => l.cuenta_id && (l.debito > 0 || l.credito > 0)).length;
  const canSave = isBalanced && validLineCount >= 2 && descripcion.trim() !== '';

  // --- Manejadores de Eventos ---

  const handleLineChange = (key: string, field: keyof JournalLineWithNature, value: any) => {
    setLines(prevLines =>
      prevLines.map(line => {
        if (line.tempKey === key) {
          if (field === 'cuenta_id') {
            const selectedAccount = catalog.find(acc => acc.id === parseInt(value));

            if (selectedAccount) {
              // Allow selecting cuentas mayores and detalle
              setValidationError('');
              return {
                ...line,
                cuenta_id: parseInt(value),
                codigo: selectedAccount.codigo,
                nombre: selectedAccount.nombre,
                naturaleza: selectedAccount.naturaleza,
                debito: 0.00,
                credito: 0.00,
              };
            }

            return {
              ...line,
              cuenta_id: null,
              codigo: '',
              nombre: '',
              naturaleza: null,
              debito: 0.00,
              credito: 0.00,
            };
          }

          let numValue = (field === 'debito' || field === 'credito') ? parseFloat(value) || 0 : value;
          
          if (field === 'debito' && numValue > 0) {
            return { ...line, debito: numValue, credito: 0 };
          }
          if (field === 'credito' && numValue > 0) {
            return { ...line, debito: 0, credito: numValue };
          }
          
          if ((field === 'debito' || field === 'credito') && numValue === 0) {
              return { ...line, [field]: 0 };
          }

          return { ...line, [field]: numValue };
        }
        return line;
      })
    );
  };

  const addLine = () => {
    setLines(prevLines => [
      ...prevLines,
      { ...initialLine, tempKey: Date.now().toString() + Math.random() },
    ]);
  };

  const removeLine = (key: string) => {
    setLines(prevLines => prevLines.filter(line => line.tempKey !== key));
  };

  const handleSubmit = async () => {
    setValidationError('');
    
    if (!canSave) {
      if (!isBalanced) {
        setValidationError('El débito y el crédito deben ser iguales.');
      } else if (validLineCount < 2) {
        setValidationError('Debe haber al menos dos líneas válidas (cuenta y monto) para un asiento.');
      } else if (descripcion.trim() === '') {
        setValidationError('La descripción del asiento es obligatoria.');
      }
      return;
    }

    const invalidLinesWithValues = lines.some(line => (!line.cuenta_id || line.naturaleza === null) && (line.debito > 0 || line.credito > 0));
    if (invalidLinesWithValues) {
       setValidationError('Todas las líneas con valor deben tener una cuenta de detalle seleccionada.');
       return;
    }

    const validLines = lines
      .filter(line => line.cuenta_id && (line.debito > 0 || line.credito > 0))
      .map(({ tempKey, codigo, nombre, naturaleza, ...rest }) => rest as JournalLine); 

    const newAsiento: NewAsientoData = {
      id: 0,
      fecha,
      descripcion: descripcion.trim(),
      referencia: referencia.trim(),
      lineas: validLines,
    };

    setIsSaving(true);
    const success = await onSave(newAsiento);
    setIsSaving(false);

    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // --- Renderizado del Componente ---

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex justify-center items-start pt-10 pb-10 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-11/12 max-w-5xl flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Registrar Nuevo Asiento de Diario</h2>
        
        {/* Sección de Encabezado y Calculadora de IVA */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descripción (Concepto)</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              maxLength={255}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Referencia (Opcional)</label>
            <input
              type="text"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              maxLength={50}
            />
          </div>
          
          {/* Calculadora de IVA */}
          <div className="col-span-2 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Calculadora de IVA 🧮</h3>
            
            <div className="grid grid-cols-4 gap-3 text-sm">
              
              {/* Monto Base */}
              <div>
                <label className="block text-xs font-medium text-gray-600">Monto Base</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={baseAmount.toFixed(2)}
                  onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-1.5 text-right font-medium"
                />
              </div>
              
              {/* Tasa IVA */}
              <div>
                <label className="block text-xs font-medium text-gray-600">Tasa IVA (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={(ivaRate * 100).toFixed(2)}
                  onChange={(e) => setIvaRate((parseFloat(e.target.value) || 0) / 100)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-1.5 text-right"
                />
              </div>
              
              {/* Tipo de Cálculo */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600">Tipo de Cálculo</label>
                <select
                  value={ivaCalculationType}
                  onChange={(e) => setIvaCalculationType(e.target.value as 'added' | 'included')}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-1.5"
                >
                  <option value="added">IVA Añadido (Monto Base es el Neto)</option>
                  <option value="included">IVA Incluido (Monto Base es el Bruto)</option>
                </select>
              </div>
            </div>

            {/* Resultados */}
            <div className="flex justify-between items-center mt-3 p-2 bg-gray-100 rounded-md">
                <div className="text-center w-1/3">
                    <span className="block text-xs text-gray-500">Neto (sin IVA)</span>
                    <span className="text-gray-800 font-bold text-sm">${calculatedNet.toFixed(2)}</span>
                </div>
                <div className="text-center w-1/3 border-l border-r border-gray-300">
                    <span className="block text-xs text-red-600">IVA ({ (ivaRate * 100).toFixed(2) }%)</span>
                    <span className="text-red-600 font-bold text-lg">${calculatedIva.toFixed(2)}</span>
                </div>
                <div className="text-center w-1/3">
                    <span className="block text-xs text-blue-600">Total Bruto</span>
                    <span className="text-blue-600 font-bold text-sm">${calculatedGross.toFixed(2)}</span>
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              *Ingresa los valores (Neto, IVA, Bruto) en las líneas contables manualmente.
            </p>
          </div>
        </div>

        {/* Sección de Líneas Contables */}
        <div className="pr-2 mb-4 space-y-2 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-700 sticky top-0 bg-white">Líneas Contables</h3>
          <div className="grid grid-cols-12 gap-2 text-sm font-bold text-gray-600 pb-2 border-b">
            <div className="col-span-5">Cuenta</div>
            <div className="col-span-3 text-right">DEBE</div>
            <div className="col-span-3 text-right">HABER</div>
            <div className="col-span-1"></div>
          </div>
          
          {lines.map((line) => {
            return (
              <div key={line.tempKey} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <select
                    value={line.cuenta_id ?? ''}
                    onChange={(e) => handleLineChange(line.tempKey, 'cuenta_id', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                  >
                    <option value="">-- Seleccionar Cuenta --</option>
                    {accountsForSelect.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.codigo} - {acc.nombre} {acc.es_cuenta_mayor ? '(Mayor)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.debito.toFixed(2)}
                    onChange={(e) => handleLineChange(line.tempKey, 'debito', e.target.value)}
                    className={`block w-full border rounded-md shadow-sm p-2 text-right text-sm`}
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.credito.toFixed(2)}
                    onChange={(e) => handleLineChange(line.tempKey, 'credito', e.target.value)}
                    className={`block w-full border rounded-md shadow-sm p-2 text-right text-sm`}
                  />
                </div>
                <div className="col-span-1 text-center">
                  {lines.length > 1 && (
                    <button
                      onClick={() => removeLine(line.tempKey)}
                      className="text-red-500 hover:text-red-700"
                      title="Eliminar línea"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 6h6v10H7V6z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          <button
            onClick={addLine}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            + Agregar Línea
          </button>
        </div>

        {/* Sección de Totales y Guardar */}
        <div className="border-t pt-4 space-y-2">
          <div className="grid grid-cols-12 gap-2 text-lg font-bold">
            <div className="col-span-5">Totales:</div>
            <div className="col-span-3 text-right text-blue-700">{totalDebito.toFixed(2)}</div>
            <div className="col-span-3 text-right text-blue-700">{totalCredito.toFixed(2)}</div>
            <div className="col-span-1"></div>
          </div>
          
          <div className={`text-center p-2 rounded-lg font-semibold ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isBalanced 
              ? 'ASIENTO BALANCEADO ✅' 
              : `Diferencia: ${balanceDifference.toFixed(2)} ❌`}
          </div>
          
          {validationError && (
            <div className="text-red-500 text-center text-sm">{validationError}</div>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition duration-150"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className={`px-6 py-2 rounded-lg font-semibold transition duration-150 ${canSave && !isSaving 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-blue-300 text-white cursor-not-allowed'}`}
            disabled={!canSave || isSaving}
          >
            {isSaving ? 'Registrando...' : 'Guardar Asiento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsientoModal;