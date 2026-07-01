<script setup lang="ts">
import { ref } from 'vue';
import { Download, FileJson, Upload } from 'lucide-vue-next';
import { useInventoryStore } from '../stores/inventory';
import { buildMonthlyReport, currentMonthInputValue, downloadText, toCsv } from '../utils/inventory';

const store = useInventoryStore();
const status = ref('');
const reportMonth = ref(currentMonthInputValue());

async function downloadBackup() {
  const backup = await store.exportBackup();
  downloadText(`rema-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
  await store.markBackupDownloaded();
  status.value = 'Резервная копия скачана.';
}

async function importBackup(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    await store.importBackup(JSON.parse(text));
    status.value = 'Данные импортированы.';
  } catch (error) {
    status.value = error instanceof Error ? error.message : 'Не удалось импортировать файл.';
  } finally {
    input.value = '';
  }
}

function exportReportCsv() {
  const rows = buildMonthlyReport(store.parts, store.movements, reportMonth.value, 'all');
  const csv = toCsv(
    rows.map((row) => ({
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
  downloadText(`rema-report-${reportMonth.value}.csv`, `\ufeff${csv}`, 'text/csv;charset=utf-8');
}
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Локальные данные</p>
        <h1>Резервная копия</h1>
      </div>
    </div>

    <div class="backup-grid">
      <section class="panel backup-panel">
        <FileJson :size="26" />
        <h2>JSON-бэкап</h2>
        <p>Сохраняет все запчасти, склады, обходчиков, операции и настройки приложения.</p>
        <button class="button primary" type="button" @click="downloadBackup">
          <Download :size="18" />
          <span>Скачать резервную копию</span>
        </button>
        <p class="muted">Последняя копия: {{ store.settings?.lastBackupAt ? new Date(store.settings.lastBackupAt).toLocaleString('ru-RU') : 'еще не создавалась' }}</p>
      </section>

      <section class="panel backup-panel">
        <Upload :size="26" />
        <h2>Импорт JSON</h2>
        <p>Импорт заменит текущие локальные данные содержимым выбранного файла.</p>
        <label class="button secondary file-button">
          <Upload :size="18" />
          <span>Импортировать из JSON</span>
          <input type="file" accept="application/json,.json" @change="importBackup" />
        </label>
      </section>

      <section class="panel backup-panel">
        <Download :size="26" />
        <h2>CSV-отчет</h2>
        <p>Excel-совместимый месячный отчет по всем складам и обходчикам.</p>
        <label class="field">
          <span>Месяц</span>
          <input v-model="reportMonth" type="month" />
        </label>
        <button class="button secondary" type="button" @click="exportReportCsv">
          <Download :size="18" />
          <span>Скачать CSV</span>
        </button>
      </section>
    </div>

    <div v-if="status" class="notice">{{ status }}</div>
  </section>
</template>
