import React from 'react';
const Header: React.FC = () => {
    const themeClasses = {
        bg: 'bg-blue-1',
    };
    
    return (
        <header 
            className={`fixed top-0 left-0 z-30 w-full shadow-md transition duration-300 ease-in-out ${themeClasses.bg} h-24`}
        >
            <div className="max-w-7xl  p-2 flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                    <img src="/icons/balancex.svg" className="h-20" alt="BalanceX Logo" />
                </div>
            </div>
        </header>
    );
};

export default Header;