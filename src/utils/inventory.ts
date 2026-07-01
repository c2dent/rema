import { MAIN_WAREHOUSE_ID, type MovementType, type Part, type Person, type StockMovement, type Warehouse } from '../db';

export const movementLabels: Record<MovementType, string> = {
  receipt: 'Поступление на склад',
  issue: 'Выдача',
  work_usage: 'Расход по работе',
  private_sale: 'Частная продажа',
  return: 'Возврат',
  defect: 'Брак',
  loss: 'Потеря',
  correction_plus: 'Коррекция плюс',
  correction_minus: 'Коррекция минус',
  other: 'Другое'
};

export const movementOptions = Object.entries(movementLabels).map(([value, label]) => ({
  value: value as MovementType,
  label
}));

const personMovementSigns: Record<MovementType, 1 | -1 | 0> = {
  receipt: 0,
  issue: 1,
  work_usage: -1,
  private_sale: -1,
  return: -1,
  defect: -1,
  loss: -1,
  correction_plus: 1,
  correction_minus: -1,
  other: -1
};

export interface BalanceRow {
  partId: string;
  partName: string;
  unit: string;
  quantity: number;
  isNegative: boolean;
}

export type HolderFilter = 'all' | `person:${string}` | `warehouse:${string}`;

export interface HolderOption {
  value: HolderFilter;
  label: string;
}

export interface MovementEffect {
  holder: HolderFilter;
  quantity: number;
}

export interface ReportRow {
  partId: string;
  partName: string;
  unit: string;
  receipt: number;
  issue: number;
  work_usage: number;
  private_sale: number;
  defect: number;
  loss: number;
  return: number;
  correction: number;
  other: number;
  total: number;
}

export function movementEffects(movement: Pick<StockMovement, 'type' | 'quantity' | 'personId' | 'warehouseId'>) {
  const effects: MovementEffect[] = [];
  const warehouseId = movement.warehouseId || MAIN_WAREHOUSE_ID;

  if (movement.type === 'receipt') {
    effects.push({ holder: `warehouse:${warehouseId}`, quantity: movement.quantity });
    return effects;
  }

  if (movement.type === 'issue') {
    effects.push({ holder: `warehouse:${warehouseId}`, quantity: -movement.quantity });
    if (movement.personId) effects.push({ holder: `person:${movement.personId}`, quantity: movement.quantity });
    return effects;
  }

  if (movement.type === 'return') {
    effects.push({ holder: `warehouse:${warehouseId}`, quantity: movement.quantity });
    if (movement.personId) effects.push({ holder: `person:${movement.personId}`, quantity: -movement.quantity });
    return effects;
  }

  const personSign = personMovementSigns[movement.type];
  if (movement.personId && personSign !== 0) {
    effects.push({ holder: `person:${movement.personId}`, quantity: movement.quantity * personSign });
  }
  return effects;
}

export function netMovementQuantity(movement: StockMovement, holder: HolderFilter = 'all') {
  return movementEffects(movement)
    .filter((effect) => holder === 'all' || effect.holder === holder)
    .reduce((total, effect) => total + effect.quantity, 0);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
}

export function currentMonthInputValue() {
  return new Date().toISOString().slice(0, 7);
}

export function buildPartLookup(parts: Part[]) {
  return new Map(parts.map((part) => [part.id, part]));
}

export function buildPersonLookup(people: Person[]) {
  return new Map(people.map((person) => [person.id, person]));
}

export function buildWarehouseLookup(warehouses: Warehouse[]) {
  return new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));
}

export function partName(parts: Part[], id: string) {
  return buildPartLookup(parts).get(id)?.name ?? 'Запчасть удалена';
}

export function personName(people: Person[], id: string) {
  return buildPersonLookup(people).get(id)?.name ?? 'Обходчик скрыт';
}

export function warehouseName(warehouses: Warehouse[], id: string) {
  return buildWarehouseLookup(warehouses).get(id)?.name ?? 'Склад скрыт';
}

export function holderOptions(people: Person[], warehouses: Warehouse[]): HolderOption[] {
  return [
    { value: 'all', label: 'Все остатки' },
    ...warehouses.map((warehouse) => ({
      value: `warehouse:${warehouse.id}` as HolderFilter,
      label: `Склад: ${warehouse.name}${warehouse.isActive ? '' : ' (скрыт)'}`
    })),
    ...people.map((person) => ({
      value: `person:${person.id}` as HolderFilter,
      label: `Обходчик: ${person.name}${person.isActive ? '' : ' (скрыт)'}`
    }))
  ];
}

export function movementImpactLabel(movement: StockMovement, people: Person[], warehouses: Warehouse[]) {
  const warehouseId = movement.warehouseId || MAIN_WAREHOUSE_ID;
  const warehouse = warehouseName(warehouses, warehouseId);
  const person = movement.personId ? personName(people, movement.personId) : '';

  if (movement.type === 'receipt') return `${warehouse} +${movement.quantity}`;
  if (movement.type === 'issue') return `${warehouse} -${movement.quantity}${person ? ` · ${person} +${movement.quantity}` : ''}`;
  if (movement.type === 'return') return `${warehouse} +${movement.quantity}${person ? ` · ${person} -${movement.quantity}` : ''}`;

  const quantity = netMovementQuantity(movement);
  return `${person || 'Без обходчика'} ${quantity > 0 ? '+' : ''}${quantity}`;
}

export function movementMatchesHolder(movement: StockMovement, holder: HolderFilter) {
  return holder === 'all' || movementEffects(movement).some((effect) => effect.holder === holder);
}

export function calculateBalances(parts: Part[], movements: StockMovement[], holder: HolderFilter = 'all') {
  const totals = new Map<string, number>();

  for (const movement of movements) {
    const quantity = netMovementQuantity(movement, holder);
    if (!quantity) continue;
    totals.set(movement.partId, (totals.get(movement.partId) ?? 0) + quantity);
  }

  return parts
    .filter((part) => part.isActive || totals.has(part.id))
    .map<BalanceRow>((part) => {
      const quantity = roundNumber(totals.get(part.id) ?? 0);
      return {
        partId: part.id,
        partName: part.name,
        unit: part.unit,
        quantity,
        isNegative: quantity < 0
      };
    })
    .sort((a, b) => a.partName.localeCompare(b.partName, 'ru'));
}

export function buildMonthlyReport(
  parts: Part[],
  movements: StockMovement[],
  month: string,
  holder: HolderFilter = 'all'
) {
  const rows = new Map<string, ReportRow>();
  const partLookup = buildPartLookup(parts);

  const ensureRow = (partId: string): ReportRow => {
    const part = partLookup.get(partId);
    const existing = rows.get(partId);
    if (existing) return existing;

    const row: ReportRow = {
      partId,
      partName: part?.name ?? 'Запчасть удалена',
      unit: part?.unit ?? '',
      receipt: 0,
      issue: 0,
      work_usage: 0,
      private_sale: 0,
      defect: 0,
      loss: 0,
      return: 0,
      correction: 0,
      other: 0,
      total: 0
    };
    rows.set(partId, row);
    return row;
  };

  for (const movement of movements) {
    if (!movement.date.startsWith(month)) continue;
    if (!movementMatchesHolder(movement, holder)) continue;

    const row = ensureRow(movement.partId);
    if (movement.type === 'receipt') row.receipt += movement.quantity;
    else if (movement.type === 'correction_plus') row.correction += movement.quantity;
    else if (movement.type === 'correction_minus') row.correction -= movement.quantity;
    else row[movement.type] += movement.quantity;
    row.total += netMovementQuantity(movement, holder);
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      receipt: roundNumber(row.receipt),
      issue: roundNumber(row.issue),
      work_usage: roundNumber(row.work_usage),
      private_sale: roundNumber(row.private_sale),
      defect: roundNumber(row.defect),
      loss: roundNumber(row.loss),
      return: roundNumber(row.return),
      correction: roundNumber(row.correction),
      other: roundNumber(row.other),
      total: roundNumber(row.total)
    }))
    .sort((a, b) => a.partName.localeCompare(b.partName, 'ru'));
}

export function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [
    headers.map(escapeCell).join(';'),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(';'))
  ].join('\n');
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function roundNumber(value: number) {
  return Math.round(value * 1000) / 1000;
}
