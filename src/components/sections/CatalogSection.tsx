import React, { useState, useRef } from 'react';
import type { Account, NewAccountData } from '../../types/account';
import AddAccountModal from '../modals/AddAccountModal';

interface CatalogSectionProps {
  catalog: Account[];
  isLoading: boolean;
  addAccount: (data: NewAccountData) => Promise<boolean>;
  updateAccount: (accountId: number, data: NewAccountData) => Promise<boolean>;
  deleteAccount: (accountId: number) => Promise<boolean>;
  importAccounts: (accounts: any[]) => Promise<any>;
}

const CatalogSection: React.FC<CatalogSectionProps> = ({ catalog, isLoading, addAccount, updateAccount, deleteAccount, importAccounts }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];
    const stripQuotes = (s: string) => s.replace(/\uFEFF/g, '').replace(/^"|"$/g, '').trim();
    const headers = lines[0].split(',').map(h => stripQuotes(h).toLowerCase());
    const rows = lines.slice(1);
    const results: any[] = [];
    for (const row of rows) {
      // simple CSV split, does not fully support quoted commas
      const cols = row.split(',').map(c => stripQuotes(c));
      const obj: any = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = cols[i] !== undefined ? cols[i] : '';
      }
      results.push(obj);
    }
    return results;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!window.confirm('Importar archivo CSV: ¿Desea continuar? Asegúrese de que el CSV tiene cabeceras: codigo,nombre,naturaleza,esCuentaMayor,parent_codigo')) {
      e.currentTarget.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        alert('Archivo CSV vacío o inválido.');
        return;
      }

      // Map parsed rows to expected object shape
      const mapped = parsed.map((r: any) => ({
        codigo: r.codigo || r.code || r.cod || r.account || '',
        nombre: r.nombre || r.name || '',
        naturaleza: (r.naturaleza || r.nature || r.type || 'D').toUpperCase(),
        esCuentaMayor: (String(r.escuentamayor || r.es_cuenta_mayor || r.ismain || r.main || '')).toLowerCase() === 'true' || (r.escuentamayor === '1') || (r.escuentamayor === 'sí') || (r.escuentamayor === 'si'),
        parent_codigo: r.parent_codigo || r.parentCode || r.parent || r.padre || null,
      }));

      const result = await importAccounts(mapped);
      alert(`Importación completa. Insertados: ${result.insertedCount || 0}. Omitidos: ${result.skippedCount || 0}. Errores: ${(result.failures || []).length}`);
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Error leyendo CSV:', err);
      alert('Error al procesar el archivo CSV. Revise el formato.');
    } finally {
      setIsImporting(false);
    }
  };

  const getNatureColor = (nature: 'D' | 'C') => {
    return nature === 'D' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getMajorStatus = (isMajor: boolean) => {
    return isMajor ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600';
  };
  
  const onDeleteClick = async (account: Account) => {
    const confirmationMessage = `
    ¡ADVERTENCIA DE ELIMINACIÓN! 🚨
      
    Está a punto de eliminar la cuenta: ${account.codigo} - ${account.nombre}.

    Esta acción es irreversible y eliminará:
    - TODAS las subcuentas dependientes.
    - TODOS los registros de asientos de diario, libro diario y libro mayor asociados a esta cuenta y sus subcuentas.

    ¿Está seguro de que desea continuar?
    `;

    if (window.confirm(confirmationMessage)) {
      const success = await deleteAccount(account.id);
      if (!success) {
        alert(`Fallo al eliminar la cuenta ${account.codigo}. Revise si la cuenta tiene restricciones (e.g. saldos iniciales fijos).`);
      }
    }
  };

  const onEditClick = (account: Account) => {
    setAccountToEdit(account);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (data: NewAccountData) => {
    if (!accountToEdit) return false;
    const success = await updateAccount(accountToEdit.id, data);
    if (success) {
      setIsEditModalOpen(false);
      setAccountToEdit(null);
    }
    return success;
  };

  const renderAccountRow = (account: Account, level = 0, renderedIds = new Set<number>()): React.ReactNode => {
    if (renderedIds.has(account.id)) return null; 
    renderedIds.add(account.id);
    const cuentaMayorNegrita = account.es_cuenta_mayor ? "font-bold" : "";

    const children = catalog.filter(c => c.parent_id === account.id && c.id !== account.id);

    return (
      <React.Fragment key={account.id}>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.codigo}</td>
          
          <td className={`px-6 py-4 ${cuentaMayorNegrita} whitespace-nowrap text-sm text-gray-800`} style={{ paddingLeft: `${level * 10}px` }}>
            {account.nombre}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className={`px-3 inline-flex text-xs leading-5 font-semibold rounded-full ${getNatureColor(account.naturaleza)}`}>
              {account.naturaleza === 'D' ? 'DEUDORA' : 'ACREEDORA'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className={`px-3 inline-flex text-xs leading-5 font-semibold rounded-full ${getMajorStatus(account.es_cuenta_mayor)}`}>
              {account.es_cuenta_mayor ? 'SÍ' : 'NO'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
            <button
              onClick={() => onEditClick(account)}
              className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out font-semibold px-2 py-1 rounded-md border border-blue-600 hover:border-blue-900 mr-2"
              title="Editar esta cuenta"
            >
              Editar
            </button>
            <button
              onClick={() => onDeleteClick(account)}
              className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out font-semibold px-2 py-1 rounded-md border border-red-600 hover:border-red-900"
              title="Eliminar esta cuenta y toda su historia transaccional."
            >
              Eliminar
            </button>
          </td>
        </tr>
        {children.map(child => renderAccountRow(child, level + 1, renderedIds))}
      </React.Fragment>
    );
  };

  const rootAccounts = catalog.filter(c => !c.parent_id);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Catálogo de Cuentas</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input ref={fileInputRef} onChange={handleFileChange} type="file" accept=".csv,text/csv" id="catalogFile" className="hidden" />
            <button id="importBtn" disabled={isImporting} onClick={() => fileInputRef.current?.click()} className={`px-4 py-2 ${isImporting ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600'} text-white font-semibold rounded-lg shadow-md transition duration-200`}>
              {isImporting ? 'Importando...' : 'Importar CSV'}
            </button>
          </label>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
          >
            + Agregar Nueva Cuenta
          </button>
        </div>
      </div>

      {isLoading && catalog.length === 0 ? (
        <div className="text-center py-10 text-xl text-gray-500">Cargando catálogo...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Código</th>
                <th className=" py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4/12">Nombre de la Cuenta</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Naturaleza</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Cuenta Detalle</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rootAccounts.map(account => renderAccountRow(account))}
            </tbody>
          </table>
          {catalog.length === 0 && !isLoading && (
            <div className="text-center py-8 text-lg text-gray-500">No hay cuentas en el catálogo. ¡Agrega la primera!</div>
          )}
        </div>
      )}

      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={addAccount}
        catalog={catalog} 
      />

      <AddAccountModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setAccountToEdit(null);
        }}
        onSave={handleEditSave}
        catalog={catalog}
        accountToEdit={accountToEdit}
      />
    </div>
  );
};

export default CatalogSection;
