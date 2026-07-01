import { defineStore } from 'pinia';
import { db, createId, ensureSettings, nowIso, type AppSettings, type EditableStockMovement, type NewPart, type NewPerson, type NewStockMovement, type Part, type Person, type StockMovement } from '../db';

interface InventoryState {
  parts: Part[];
  people: Person[];
  movements: StockMovement[];
  settings: AppSettings | null;
  isLoaded: boolean;
}

export const useInventoryStore = defineStore('inventory', {
  state: (): InventoryState => ({
    parts: [],
    people: [],
    movements: [],
    settings: null,
    isLoaded: false
  }),
  getters: {
    activeParts: (state) => state.parts.filter((part) => part.isActive),
    activePeople: (state) => state.people.filter((person) => person.isActive)
  },
  actions: {
    async loadAll() {
      this.settings = await ensureSettings();
      const [parts, people, movements] = await Promise.all([
        db.parts.orderBy('name').toArray(),
        db.people.orderBy('name').toArray(),
        db.stockMovements.orderBy('date').reverse().toArray()
      ]);
      this.parts = parts;
      this.people = people;
      this.movements = movements;
      this.isLoaded = true;
    },
    async addPart(input: NewPart) {
      const timestamp = nowIso();
      await db.parts.add({
        id: createId(),
        name: input.name.trim(),
        unit: input.unit.trim(),
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      await this.loadAll();
    },
    async updatePart(part: Pick<Part, 'id' | 'name' | 'unit' | 'isActive'>) {
      await db.parts.update(part.id, {
        name: part.name.trim(),
        unit: part.unit.trim(),
        isActive: part.isActive,
        updatedAt: nowIso()
      });
      await this.loadAll();
    },
    async addPerson(input: NewPerson) {
      const timestamp = nowIso();
      await db.people.add({
        id: createId(),
        name: input.name.trim(),
        phone: input.phone.trim(),
        comment: input.comment.trim(),
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      await this.loadAll();
    },
    async updatePerson(person: Pick<Person, 'id' | 'name' | 'phone' | 'comment' | 'isActive'>) {
      await db.people.update(person.id, {
        name: person.name.trim(),
        phone: person.phone.trim(),
        comment: person.comment.trim(),
        isActive: person.isActive,
        updatedAt: nowIso()
      });
      await this.loadAll();
    },
    async addMovement(input: NewStockMovement) {
      const timestamp = nowIso();
      await db.stockMovements.add({
        ...input,
        id: createId(),
        quantity: Number(input.quantity),
        reason: input.reason.trim(),
        comment: input.comment.trim(),
        createdAt: timestamp,
        updatedAt: timestamp
      });
      await this.loadAll();
    },
    async updateMovement(input: EditableStockMovement) {
      await db.stockMovements.update(input.id, {
        date: input.date,
        type: input.type,
        partId: input.partId,
        personId: input.personId,
        quantity: Number(input.quantity),
        reason: input.reason.trim(),
        comment: input.comment.trim(),
        updatedAt: nowIso()
      });
      await this.loadAll();
    },
    async deleteMovement(id: string) {
      await db.stockMovements.delete(id);
      await this.loadAll();
    },
    async exportBackup() {
      await this.loadAll();
      return {
        exportedAt: nowIso(),
        app: this.settings,
        parts: this.parts,
        people: this.people,
        stockMovements: this.movements
      };
    },
    async importBackup(payload: unknown) {
      const data = payload as Partial<{
        app: AppSettings;
        parts: Part[];
        people: Person[];
        stockMovements: StockMovement[];
      }>;

      if (!Array.isArray(data.parts) || !Array.isArray(data.people) || !Array.isArray(data.stockMovements)) {
        throw new Error('Файл резервной копии имеет неверный формат.');
      }

      await db.transaction('rw', db.parts, db.people, db.stockMovements, db.appSettings, async () => {
        await Promise.all([
          db.parts.clear(),
          db.people.clear(),
          db.stockMovements.clear(),
          db.appSettings.clear()
        ]);
        await db.parts.bulkPut(data.parts ?? []);
        await db.people.bulkPut(data.people ?? []);
        await db.stockMovements.bulkPut(data.stockMovements ?? []);
        await db.appSettings.put({
          id: 'main',
          appName: data.app?.appName ?? 'Rema',
          version: data.app?.version ?? '0.1.0',
          lastBackupAt: data.app?.lastBackupAt ?? null,
          createdAt: data.app?.createdAt ?? nowIso(),
          updatedAt: nowIso()
        });
      });
      await this.loadAll();
    },
    async markBackupDownloaded() {
      await db.appSettings.update('main', {
        lastBackupAt: nowIso(),
        updatedAt: nowIso()
      });
      await this.loadAll();
    }
  }
});
