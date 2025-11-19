import React, { useState } from 'react';
import type { User } from '../../types/user';

interface SidebarProps {
    onSectionChange: (section: string) => void; 
    onAsientoClick: () => void;
    user: User | null;
    onLogout: () => void;
}

interface MenuItem {
    name: string;
    isModal?: boolean;
    isDelete?: boolean;
    isHeader?: boolean;
    action?: (fn: any) => void;
}

const menuItems: MenuItem[] = [
    { name: 'Bienvenido', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Bienvenido') }, 
    { name: 'Registrar Asiento', isModal: true, action: (onAsientoClick: () => void) => onAsientoClick() }, 
    { name: 'Libro Diario', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Libro Diario') },
    { name: 'Libro Mayor', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Libro Mayor') },
    { name: 'Catálogo', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Catálogo') },
    { name: 'Estados Financieros', isHeader: true },
    { name: 'Balance de Comprobación', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Balance de Comprobación') },
    { name: 'Balance General', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Balance General') },
    { name: 'Estado de Resultados', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Estado de Resultados') },
] as const;

const Sidebar: React.FC<SidebarProps> = ({ onSectionChange, onAsientoClick, user, onLogout }) => {
    const [activeSection, setActiveSection] = useState('Bienvenido');

    const handleClick = (item: MenuItem) => {
        const sectionName = item.name;
        
        if (item.isModal && sectionName === 'Registrar Asiento') {
            onAsientoClick();
        } else {
            setActiveSection(sectionName);
            onSectionChange(sectionName);
        }
    };

    return (
        <div className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl z-20 pt-24 flex flex-col">
            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                {menuItems.map((item) => {
                    if ((item as any).isHeader) {
                        return (
                            <div key={item.name} className="pt-4 pb-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-700 mb-2">
                                {item.name}
                            </div>
                        );
                    }

                    const sectionName = item.name;
                    const isActive = activeSection === sectionName;

                    return (
                        <a
                            key={sectionName}
                            onClick={() => handleClick(item)}
                            className={`flex items-center space-x-3 p-3 rounded-lg text-base transition-all duration-200 ease-in-out font-medium cursor-pointer group
                                ${isActive 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'hover:bg-gray-700 hover:pl-4'
                                }`}
                        >
                            <span className={`${isActive ? 'font-semibold' : ''}`}>{sectionName}</span>
                        </a>
                    );
                })}
            </nav>
            {user && (
                <div className="border-t border-gray-700 p-4 space-y-3 bg-gray-900">
                    <div className="text-white p-3 bg-gray-800 rounded-lg">
                        <p className="font-semibold text-sm truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400 truncate">{user.companyName}</p>
                        <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full px-3 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition duration-200 shadow-md hover:shadow-lg"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
    );
};

export default Sidebar;