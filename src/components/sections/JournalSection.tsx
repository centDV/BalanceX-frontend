import React, { useEffect, useState, useCallback, useMemo } from "react";
import type { NewAsientoData } from "../../types/journal";
import type { Account } from '../../types/account';


interface JournalSectionProps {
    userId: string;
    isLoading: boolean;
    fetchJournal: (userId: string) => Promise<NewAsientoData[]>;
    catalog: Account[];
    onSave?: (data: NewAsientoData) => Promise<boolean>;
    onDelete?: (asientoId: number) => Promise<void>;
}

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Error parsing date:", e);
        return dateString;
    }
};

const JournalSection: React.FC<JournalSectionProps> = ({
    userId,
    isLoading,
    fetchJournal,
    catalog,
    onDelete,
}) => {
    const [asientos, setAsientos] = useState<NewAsientoData[]>([]);
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);
    
    // 🆕 ESTADOS DE FILTRO
    const [dateFilter, setDateFilter] = useState('');
    const [descriptionFilter, setDescriptionFilter] = useState('');

    const accounts = useMemo(() => {
        return catalog;
    }, [catalog]);

    const getAccountName = (cuentaId: number | null): string => {
        if (cuentaId === null) {
            return "[Error: ID de Cuenta Nulo]";
        }
        const account = accounts.find(acc => acc.id === cuentaId);
        return account ? account.nombre : `[Error: Cuenta ${cuentaId} no encontrada]`;
    };

    const loadJournal = useCallback(async () => {
        if (!userId) return;
        setIsLoadingLocal(true);
        try {
            const data = await fetchJournal(userId);
            setAsientos(data);
        } catch (err) {
            console.error("Error al cargar el libro diario:", err);
            setAsientos([]);
        } finally {
            setIsLoadingLocal(false);
        }
    }, [userId, fetchJournal]);

    useEffect(() => {
        loadJournal();
    }, [loadJournal]);
    
    // 🆕 LÓGICA DE FILTRADO MEMORIZADA
    const filteredAsientos = useMemo(() => {
        if (!asientos.length) return [];

        return asientos.filter(asiento => {
            let matchesDate = true;
            let matchesDescription = true;
            
            // 1. Filtrar por Fecha
            if (dateFilter) {
                const asientoDate = formatDate(asiento.fecha);
                // La fecha de entrada debe ser un prefijo de la fecha del asiento (para que un input '2023-11' muestre todo noviembre)
                matchesDate = asientoDate.startsWith(dateFilter);
            }

            // 2. Filtrar por Descripción
            if (descriptionFilter) {
                const lowerCaseFilter = descriptionFilter.toLowerCase();
                const description = `${asiento.descripcion} ${asiento.referencia || ''}`.toLowerCase();
                matchesDescription = description.includes(lowerCaseFilter);
            }

            return matchesDate && matchesDescription;
        });
    }, [asientos, dateFilter, descriptionFilter]);

    // Ordenar los asientos filtrados por fecha ascendente y asignar número secuencial
    const sortedFilteredAsientos = useMemo(() => {
        if (!filteredAsientos.length) return [];
        // Copiamos y ordenamos por fecha; si la fecha es igual, ordenamos por id para estabilidad
        return filteredAsientos.slice().sort((a, b) => {
            const ta = Date.parse(a.fecha as string);
            const tb = Date.parse(b.fecha as string);
            if (isNaN(ta) && isNaN(tb)) return 0;
            if (isNaN(ta)) return 1;
            if (isNaN(tb)) return -1;
            if (ta !== tb) return ta - tb;
            const ida = a.id || 0;
            const idb = b.id || 0;
            return ida - idb;
        });
    }, [filteredAsientos]);


    return (
        <section className="p-8 bg-white rounded-xl shadow">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Libro Diario</h1>
            </div>
            
            {/* 🆕 CONTROLES DE FILTRO */}
            <div className="mb-6 flex space-x-4">
                <input
                    type="date"
                    placeholder="Filtrar por Fecha"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 w-1/4"
                />
                <input
                    type="text"
                    placeholder="Filtrar por Descripción o Referencia"
                    value={descriptionFilter}
                    onChange={(e) => setDescriptionFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 w-3/4"
                />
            </div>
            {/* FIN CONTROLES DE FILTRO */}

            {(isLoadingLocal || isLoading) ? (
                <p className="text-gray-500">Cargando asientos...</p>
            ) : asientos.length === 0 ? (
                <p className="text-gray-500">No hay asientos registrados.</p>
            ) : filteredAsientos.length === 0 ? (
                <p className="text-gray-500">No se encontraron asientos con los criterios de filtro aplicados.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left w-2/12">Fecha</th>
                                <th className="px-3 py-2 text-left w-6/12">Cuenta / Descripción</th>
                                <th className="px-3 py-2 text-right w-2/12">DEBE</th>
                                <th className="px-3 py-2 text-right w-2/12">HABER</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Usamos los asientos filtrados y ordenados por fecha */}
                            {sortedFilteredAsientos.map((asiento, idx) => {
                                // Mantenemos el total para la validación del balance
                                const totalDebito = asiento.lineas.reduce((sum, line) => sum + line.debito, 0);
                                const totalCredito = asiento.lineas.reduce((sum, line) => sum + line.credito, 0);

                                const asientoNumber = idx + 1; // número secuencial basado en la fecha (orden asc)

                                return (
                                    <React.Fragment key={asiento.id || idx}>
                                        <tr className="bg-gray-50 border-t-2 border-gray-300">
                                            <td className="px-3 py-2 text-sm font-semibold">{formatDate(asiento.fecha)}</td>
                                            <td colSpan={3} className="px-3 py-2 text-sm font-semibold">
                                                {`Asiento N° ${asientoNumber}: ${asiento.descripcion} ${asiento.referencia ? `(Ref: ${asiento.referencia})` : ''}`}
                                            </td>
                                        </tr>

                                        {asiento.lineas.map((line, i) => (
                                            <tr key={`${asiento.id || asientoNumber}-${i}`} className="border-t border-gray-200 text-sm hover:bg-gray-50 transition">
                                                <td className="px-3 py-1"></td>
                                                <td className={`px-3 py-1 ${line.credito > 0 ? 'pl-10' : 'font-medium'}`}>
                                                    {getAccountName(line.cuenta_id)}
                                                </td>
                                                <td className="px-3 py-1 text-right text-green-700 font-mono">
                                                    {line.debito > 0 ? `$${line.debito.toFixed(2)}` : ''}
                                                </td>
                                                <td className="px-3 py-1 text-right text-red-700 font-mono">
                                                    {line.credito > 0 ? `$${line.credito.toFixed(2)}` : ''}
                                                </td>
                                            </tr>
                                        ))}

                                        <tr className={`border-t border-b-2 font-bold text-sm ${totalDebito.toFixed(2) !== totalCredito.toFixed(2) ? 'bg-red-100 text-red-700 border-red-400' : 'bg-green-50 text-green-700 border-green-400'}`}>
                                            <td className="px-3 py-2"></td>
                                            <td className="px-3 py-2 text-right flex justify-between items-center">
                                                {onDelete && asiento.id && ( // Aseguramos que el asiento tenga ID para poder eliminar
                                                    <button
                                                        className="ml-4 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                                                        onClick={() => onDelete(asiento.id as number)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}
                                                <span>
                                                    TOTAL ASIENTO N° {asientoNumber}
                                                </span>

                                            </td>
                                            <td className="px-3 py-2 text-right font-mono">${totalDebito.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right font-mono">${totalCredito.toFixed(2)}</td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

        </section>
    );
};

export default JournalSection;