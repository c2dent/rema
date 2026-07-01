import Dexie, { type Table } from 'dexie';

export type MovementType =
  | 'issue'
  | 'work_usage'
  | 'private_sale'
  | 'return'
  | 'defect'
  | 'loss'
  | 'correction_plus'
  | 'correction_minus'
  | 'other';

export interface Part {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  comment: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  date: string;
  type: MovementType;
  partId: string;
  personId: string;
  quantity: number;
  reason: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string;
  appName: string;
  version: string;
  lastBackupAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewStockMovement = Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt'>;
export type EditableStockMovement = Omit<StockMovement, 'createdAt' | 'updatedAt'>;
export type NewPart = Pick<Part, 'name' | 'unit'>;
export type NewPerson = Pick<Person, 'name' | 'phone' | 'comment'>;

class RemaDatabase extends Dexie {
  parts!: Table<Part, string>;
  people!: Table<Person, string>;
  stockMovements!: Table<StockMovement, string>;
  appSettings!: Table<AppSettings, string>;

  constructor() {
    super('rema');
    this.version(1).stores({
      parts: 'id, name, isActive, updatedAt',
      people: 'id, name, isActive, updatedAt',
      stockMovements: 'id, date, type, partId, personId, updatedAt',
      appSettings: 'id'
    });
  }
}

export const db = new RemaDatabase();

export const nowIso = () => new Date().toISOString();

export const createId = () => {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export async function ensureSettings() {
  const existing = await db.appSettings.get('main');
  if (existing) return existing;

  const timestamp = nowIso();
  const settings: AppSettings = {
    id: 'main',
    appName: 'Rema',
    version: '0.1.0',
    lastBackupAt: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await db.appSettings.put(settings);
  return settings;
}
