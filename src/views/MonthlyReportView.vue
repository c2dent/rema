<script setup lang="ts">
import { computed, reactive } from 'vue';
import { Download } from 'lucide-vue-next';
import { useInventoryStore } from '../stores/inventory';
import { buildMonthlyReport, currentMonthInputValue, downloadText, holderOptions, toCsv, type HolderFilter } from '../utils/inventory';

const store = useInventoryStore();
const filters = reactive({
  month: currentMonthInputValue(),
  holder: 'all' as HolderFilter
});

const rows = computed(() => buildMonthlyReport(store.parts, store.movements, filters.month, filters.holder));

const totals = computed(() =>
  rows.value.reduce(
    (acc, row) => {
      acc.receipt += row.receipt;
      acc.issue += row.issue;
      acc.work_usage += row.work_usage;
      acc.private_sale += row.private_sale;
      acc.defect += row.defect;
      acc.loss += row.loss;
      acc.return += row.return;
      acc.correction += row.correction;
      acc.other += row.other;
      acc.total += row.total;
      return acc;
    },
    { receipt: 0, issue: 0, work_usage: 0, private_sale: 0, defect: 0, loss: 0, return: 0, correction: 0, other: 0, total: 0 }
  )
);

function exportCsv() {
  const csv = toCsv(
    rows.value.map((row) => ({
      Запчасть: row.partName,
      Единица: row.unit,
      Поступление: row.receipt,
      Получено: row.issue,
      Работа: row.work_usage,
      Продажа: row.private_sale,
      Брак: row.defect,
      Потеря: row.loss,
      Возврат: row.return,
      Коррекция: row.correction,
      Другое: row.other,
      Остаток: row.total
    }))
  );
  downloadText(`rema-report-${filters.month}.csv`, `\ufeff${csv}`, 'text/csv;charset=utf-8');
}
</script>

<template>
  <section class="page report-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Месячный отчет</p>
        <h1>Итоги</h1>
      </div>
      <button class="icon-button primary" type="button" title="Экспорт CSV" :disabled="!rows.length" @click="exportCsv">
        <Download :size="20" />
      </button>
    </div>

    <div class="toolbar filters">
      <label class="field compact">
        <span>Месяц</span>
        <input v-model="filters.month" type="month" />
      </label>
      <label class="field compact">
        <span>Место</span>
        <select v-model="filters.holder">
          <option v-for="holder in holderOptions(store.people, store.warehouses)" :key="holder.value" :value="holder.value">
            {{ holder.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="summary-strip">
      <div>
        <span>Поступило</span>
        <strong>{{ totals.receipt }}</strong>
      </div>
      <div>
        <span>Расход</span>
        <strong>{{ totals.work_usage + totals.private_sale + totals.defect + totals.loss + totals.other }}</strong>
      </div>
      <div>
        <span>Возврат</span>
        <strong>{{ totals.return }}</strong>
      </div>
      <div :class="{ danger: totals.total < 0 }">
        <span>Остаток</span>
        <strong>{{ totals.total }}</strong>
      </div>
    </div>

    <div v-if="!rows.length" class="empty-state">
      <h2>Нет операций за месяц</h2>
      <p>Отчет появится после добавления операций за выбранный период.</p>
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Запчасть</th>
            <th>Поступление</th>
            <th>Получено</th>
            <th>Работа</th>
            <th>Продажа</th>
            <th>Брак</th>
            <th>Потеря</th>
            <th>Возврат</th>
            <th>Коррекция</th>
            <th>Другое</th>
            <th>Остаток</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.partId">
            <th>{{ row.partName }} <span>{{ row.unit }}</span></th>
            <td>{{ row.receipt }}</td>
            <td>{{ row.issue }}</td>
            <td>{{ row.work_usage }}</td>
            <td>{{ row.private_sale }}</td>
            <td>{{ row.defect }}</td>
            <td>{{ row.loss }}</td>
            <td>{{ row.return }}</td>
            <td>{{ row.correction }}</td>
            <td>{{ row.other }}</td>
            <td :class="{ negative: row.total < 0 }">{{ row.total }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
