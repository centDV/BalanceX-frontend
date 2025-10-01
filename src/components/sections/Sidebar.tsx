import React from 'react';

interface SidebarProps {
    onDeleteClick: () => void;
    onSectionChange: (section: string) => void; 
    onAsientoClick: () => void;
}

const menuItems = [
    { name: 'Bienvenido', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Bienvenido') }, 
    { name: 'Registrar Asiento', isModal: true, action: (onAsientoClick: () => void) => onAsientoClick() }, 
    { name: 'Libro Diario', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Libro Diario') },
    { name: 'Libro Mayor', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Libro Mayor') },
    { name: 'Catálogo', isModal: false, action: (onSectionChange: (section: string) => void) => onSectionChange('Catálogo') },
    { name: 'Borrar Datos', isDelete: true, action: (onDeleteClick: () => void) => onDeleteClick() }, 
];

const Sidebar: React.FC<SidebarProps> = ({ onDeleteClick, onSectionChange, onAsientoClick }) => {
    return (
        <div className="fixed top-0 left-0 h-full w-64 bg-gray-800 text-white shadow-xl z-20 pt-24">
            <nav className="p-4 space-y-2">
                {menuItems.map((item) => {
                    const sectionName = item.name;
                    let onClickHandler: () => void;

                    if (item.isDelete) {
                        onClickHandler = onDeleteClick;
                    } else if (item.isModal && sectionName === 'Registrar Asiento') {
                        onClickHandler = onAsientoClick;
                    } else {
                        onClickHandler = () => onSectionChange(sectionName);
                    }
                    

                    return (
                        <a
                            key={sectionName}
                            onClick={onClickHandler}
                            className={`
                                flex items-center space-x-3 p-3 rounded-lg text-lg transition duration-150 ease-in-out font-medium
                                ${item.isDelete 
                                    ? 'bg-red-700 hover:bg-red-600 text-white cursor-pointer mt-4' 
                                    : 'hover:bg-gray-700 cursor-pointer'
                                }
                            `}
                        >
                            {sectionName}
                        </a>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;