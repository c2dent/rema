import type { MovementType, Part, Person, StockMovement } from '../db';

export const movementLabels: Record<MovementType, string> = {
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

const movementSigns: Record<MovementType, 1 | -1> = {
  issue: 1,
  work_usage: -1,
  private_sale: -1,
  return: 1,
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

export interface ReportRow {
  partId: string;
  partName: string;
  unit: string;
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

export function signedQuantity(movement: Pick<StockMovement, 'type' | 'quantity'>) {
  return movement.quantity * movementSigns[movement.type];
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

export function partName(parts: Part[], id: string) {
  return buildPartLookup(parts).get(id)?.name ?? 'Запчасть удалена';
}

export function personName(people: Person[], id: string) {
  return buildPersonLookup(people).get(id)?.name ?? 'Обходчик скрыт';
}

export function calculateBalances(parts: Part[], movements: StockMovement[], personId = 'all') {
  const totals = new Map<string, number>();

  for (const movement of movements) {
    if (personId !== 'all' && movement.personId !== personId) continue;
    totals.set(movement.partId, (totals.get(movement.partId) ?? 0) + signedQuantity(movement));
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
  personId = 'all'
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
    if (personId !== 'all' && movement.personId !== personId) continue;

    const row = ensureRow(movement.partId);
    if (movement.type === 'correction_plus') row.correction += movement.quantity;
    else if (movement.type === 'correction_minus') row.correction -= movement.quantity;
    else row[movement.type] += movement.quantity;
    row.total += signedQuantity(movement);
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
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
