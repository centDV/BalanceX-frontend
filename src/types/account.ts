export type AccountNature = 'D' | 'C'; 

export interface Account {
  id: number;
  codigo: string;
  nombre: string;
  naturaleza: AccountNature;
  es_cuenta_mayor: boolean;
  parent_id?: number | null; 
}

export interface NewAccountData {
  codigo: string;
  nombre: string;
  naturaleza: AccountNature;
  esCuentaMayor: boolean;
  parent_id?: number | null; 
}
