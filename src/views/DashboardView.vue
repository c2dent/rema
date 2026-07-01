<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { AlertTriangle, History, Plus } from 'lucide-vue-next';
import { useInventoryStore } from '../stores/inventory';
import { calculateBalances } from '../utils/inventory';

const store = useInventoryStore();
const selectedPersonId = ref('all');

const balances = computed(() => calculateBalances(store.parts, store.movements, selectedPersonId.value));
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
        <span>Обходчик</span>
        <select v-model="selectedPersonId">
          <option value="all">Все обходчики</option>
          <option v-for="person in store.people" :key="person.id" :value="person.id">
            {{ person.name }}{{ person.isActive ? '' : ' (скрыт)' }}
          </option>
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
          <p>{{ selectedPersonId === 'all' ? 'Все обходчики' : 'Выбранный обходчик' }}</p>
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
