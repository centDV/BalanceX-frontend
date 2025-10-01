export interface JournalLine {
  tempKey: string; 
  cuenta_id: number | null;
  codigo: string;
  nombre: string; 
  debito: number;
  credito: number;
}

export interface NewAsientoData {
  id: number;
  fecha: string;
  descripcion: string;
  referencia: string; 
  lineas: Omit<JournalLine, 'tempKey' | 'codigo' | 'nombre'>[]; 
}
