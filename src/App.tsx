import React, { useState, useEffect, useRef } from 'react';
import Header from './components/sections/Header';
import UserFormModal from './components/modals/UserFormModal';
import Sidebar from './components/sections/Sidebar';
import DeleteConfirmationModal from './components/modals/DeleteConfirmationModal';
import CatalogSection from './components/sections/CatalogSection';
import JournalSection from './components/sections/JournalSection';
import LedgerSection from './components/sections/LedgerSection';
import AsientoModal from './components/modals/AsientoModal';
import { useUserData } from './hooks/useUserData';
import { useAccounting } from './hooks/useAccounting';
import { useJournal } from './hooks/useJournal';

const App: React.FC = () => {
const [activeSection, setSection] = useState('Bienvenido');
const [isAsientoModalOpen, setIsAsientoModalOpen] = useState(false);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

const {
  user,
  isModalOpen,
  isLoading,
  handleSaveUser,
  deleteUserAndReload,
  } = useUserData();

const {
  catalog,
  ledger,
  isLoadingCatalog,
  isLoadingLedger,
  fetchCatalog,
  fetchLedger,
  addAccount,
  deleteAccount,
  ledgerize,
  fetchAccountMovements,
  } = useAccounting();

const {
  saveAsiento,
  isLoadingJournal,
  fetchJournal,
  deleteAsiento,
  } = useJournal();

const catalogLoadedRef = useRef(false);
const journalLoadedRef = useRef(false);
const ledgerLoadedRef = useRef(false);

useEffect(() => {
  let userId = user?.id;

  if (!userId) {
    const userDataString = localStorage.getItem('currentUser');
    if (userDataString) {
      try {
        userId = JSON.parse(userDataString).id;
      } catch {}
    }
  }

  if (userId && (activeSection === 'Catálogo' || activeSection === 'Libro Diario' || isAsientoModalOpen) && !catalogLoadedRef.current) {
    fetchCatalog(userId);
    catalogLoadedRef.current = true; 
  }

  if (activeSection !== 'Catálogo' && !isAsientoModalOpen) {
    catalogLoadedRef.current = false;
  }

  if (userId && activeSection === 'Libro Diario' && !journalLoadedRef.current) {
    fetchJournal(userId);
    journalLoadedRef.current = true;
  }

  if (activeSection !== 'Libro Diario') {
    journalLoadedRef.current = false;
  }

  if (userId && activeSection === 'Libro Mayor' && !ledgerLoadedRef.current) {
    fetchLedger(userId);
    ledgerLoadedRef.current = true;
  }

  if (activeSection !== 'Libro Mayor') {
    ledgerLoadedRef.current = false;
  }
}, [user?.id, activeSection, isAsientoModalOpen]);

const handleOpenAsientoModal = () => {
  if (user?.id && catalog.length === 0 && !isLoadingCatalog) {
  fetchCatalog(user.id).then(() => {
  setIsAsientoModalOpen(true);
  });
  } else {
  setIsAsientoModalOpen(true);
  }
};

const handleDeleteAsiento = async (asientoId: number) => {
  if (!user?.id) return;


  const confirmed = window.confirm("¿Seguro que deseas eliminar este asiento?");
  if (!confirmed) return;

  const deleted = await deleteAsiento(asientoId, user.id);
  if (deleted) {
    fetchJournal(user.id);
  }


};

const handleSaveAsiento = async (data: any) => {
  if (!user?.id) {
  alert("Error: Usuario no identificado para guardar el asiento.");
  return false;
}


const saved = await saveAsiento(data, user.id);
  if (saved) {
    fetchJournal(user.id);
  }
  return saved;
  };

const renderSection = () => {
  if (!user) {
  return <div className="text-xl text-gray-500 p-8">
  Cargando o esperando registro de usuario... </div>;
  }


switch (activeSection) {
  case 'Catálogo':
    return (
      <CatalogSection
        catalog={catalog}
        isLoading={isLoadingCatalog}
        addAccount={(data) => addAccount(data, user.id)}
        deleteAccount={(accountId) => deleteAccount(accountId, user.id)}
      />
    );
  case 'Libro Diario':
    return (
      <JournalSection
        key={Date.now()}
        userId={user.id}
        isLoading={isLoadingJournal}
        fetchJournal={fetchJournal}
        catalog={catalog}
        onSave={handleSaveAsiento}
        onDelete={handleDeleteAsiento}
      />
    );
    
  case 'Libro Mayor':
    return (
      <LedgerSection
        ledger={ledger}
        isLoading={isLoadingLedger}
        onLedgerize={() => ledgerize(user?.id)}
        fetchLedger={() => fetchLedger(user?.id)}
        userId={user.id} 
        fetchAccountMovements={fetchAccountMovements}
      />
    );
  case 'Bienvenido':
  default:
    return (
      <div className="p-8">
        <h1 className="text-3xl font-semibold mb-4">Bienvenido al BalanceX</h1>
        <p className='text-xl text-gray-700'>
          Hola, {user.firstName} {user.lastName} de la compañía
        </p>
        <p className='mt-4 text-gray-600'>
          Usa el menú lateral para iniciar tus operaciones contables.
          <br />
          <br />Programadores:
          <br />Luis José Rodríguez Centeno
          <br />Diego Marcelo Rivera Lopez
          <br />Victor Manuel Mira Hernandez
          <br />Miguel Alejandro Reyes Amaya
        </p>
      </div>
    );
}


};

return (
<>
<Header />
<Sidebar
onDeleteClick={() => setIsDeleteModalOpen(true)}
onSectionChange={setSection}
onAsientoClick={handleOpenAsientoModal}
/>

  <UserFormModal
    isOpen={isModalOpen && !isLoading}
    onSave={handleSaveUser}
  />
  
  <DeleteConfirmationModal
    isOpen={isDeleteModalOpen}
    onClose={() => setIsDeleteModalOpen(false)}
    onConfirm={deleteUserAndReload} 
  />
  
  <AsientoModal
    isOpen={isAsientoModalOpen}
    onClose={() => setIsAsientoModalOpen(false)}
    onSave={handleSaveAsiento}
    catalog={catalog}
  />
  
  <main className="pt-24 pl-64 min-h-screen bg-gray-50">
    {renderSection()}
  </main>
</>


);
};

export default App;