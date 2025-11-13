import React from 'react';
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
    return (
        <div className="fixed top-0 left-0 h-full w-64 bg-gray-800 text-white shadow-xl z-20 pt-24 flex flex-col">
            <nav className="p-4 space-y-2 flex-1">
                {menuItems.map((item) => {
                    if ((item as any).isHeader) {
                        return (
                            <div key={item.name} className="pt-4 pb-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {item.name}
                            </div>
                        );
                    }

                    const sectionName = item.name;
                    let onClickHandler: () => void;

                    if (item.isModal && sectionName === 'Registrar Asiento') {
                        onClickHandler = onAsientoClick;
                    } else {
                        onClickHandler = () => onSectionChange(sectionName);
                    }
                    

                    return (
                        <a
                            key={sectionName}
                            onClick={onClickHandler}
                            className="flex items-center space-x-3 p-3 rounded-lg text-lg transition duration-150 ease-in-out font-medium hover:bg-gray-700 cursor-pointer"
                        >
                            {sectionName}
                        </a>
                    );
                })}
            </nav>
            {user && (
                <div className="border-t border-gray-700 p-4 space-y-3">
                    <div className="text-white">
                        <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">{user.companyName}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full px-3 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition duration-200"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
    );
};

export default Sidebar;