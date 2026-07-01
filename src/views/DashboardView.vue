<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { AlertTriangle, History, Plus } from 'lucide-vue-next';
import { useInventoryStore } from '../stores/inventory';
import { calculateBalances, holderOptions, type HolderFilter } from '../utils/inventory';

const store = useInventoryStore();
const selectedHolder = ref<HolderFilter>('all');

const holders = computed(() => holderOptions(store.people, store.warehouses));
const selectedHolderLabel = computed(() => holders.value.find((holder) => holder.value === selectedHolder.value)?.label ?? 'Все остатки');
const balances = computed(() => calculateBalances(store.parts, store.movements, selectedHolder.value));
const negativeCount = computed(() => balances.value.filter((row) => row.isNegative).length);
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Главный экран</p>
        <h1>Остатки</h1>
      </div>
      <RouterLink class="icon-button primary" to="/movement" title="Добавить операцию">
        <Plus :size="20" />
      </RouterLink>
    </div>

    <div class="toolbar">
      <label class="field compact">
        <span>Остатки</span>
        <select v-model="selectedHolder">
          <option v-for="holder in holders" :key="holder.value" :value="holder.value">{{ holder.label }}</option>
        </select>
      </label>
    </div>

    <div v-if="negativeCount" class="notice warning">
      <AlertTriangle :size="18" />
      <span>Есть отрицательные остатки: {{ negativeCount }}</span>
    </div>

    <div v-if="!store.parts.length" class="empty-state">
      <h2>Добавьте первую запчасть</h2>
      <p>После добавления справочников можно фиксировать выдачи, расходы и корректировки.</p>
      <RouterLink class="button primary" to="/parts">Открыть запчасти</RouterLink>
    </div>

    <div v-else class="list">
      <article v-for="row in balances" :key="row.partId" class="list-row stock-row" :class="{ danger: row.isNegative }">
        <div>
          <h2>{{ row.partName }}</h2>
          <p>{{ selectedHolderLabel }}</p>
        </div>
        <div class="row-actions">
          <strong class="amount">{{ row.quantity }} {{ row.unit }}</strong>
          <AlertTriangle v-if="row.isNegative" class="danger-icon" :size="19" />
          <RouterLink class="icon-button" :to="{ path: '/history', query: { partId: row.partId } }" title="История">
            <History :size="18" />
          </RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>
