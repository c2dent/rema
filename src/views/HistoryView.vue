<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Edit3, Save, Trash2, X } from 'lucide-vue-next';
import { useInventoryStore } from '../stores/inventory';
import { currentMonthInputValue, formatDate, movementLabels, movementOptions, partName, personName, signedQuantity } from '../utils/inventory';
import type { EditableStockMovement, MovementType, StockMovement } from '../db';

const store = useInventoryStore();
const route = useRoute();

const filters = reactive({
  month: currentMonthInputValue(),
  personId: 'all',
  partId: String(route.query.partId ?? 'all'),
  type: 'all' as MovementType | 'all'
});

const editing = ref<EditableStockMovement | null>(null);
const deleting = ref<StockMovement | null>(null);

watch(
  () => route.query.partId,
  (partId) => {
    if (partId) filters.partId = String(partId);
  }
);

const filteredMovements = computed(() =>
  store.movements.filter((movement) => {
    if (filters.month && !movement.date.startsWith(filters.month)) return false;
    if (filters.personId !== 'all' && movement.personId !== filters.personId) return false;
    if (filters.partId !== 'all' && movement.partId !== filters.partId) return false;
    if (filters.type !== 'all' && movement.type !== filters.type) return false;
    return true;
  })
);

function startEdit(movement: StockMovement) {
  editing.value = { ...movement };
}

async function saveEdit() {
  if (!editing.value || editing.value.quantity <= 0) return;
  await store.updateMovement(editing.value);
  editing.value = null;
}

async function confirmDelete() {
  if (!deleting.value) return;
  await store.deleteMovement(deleting.value.id);
  deleting.value = null;
}
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Журнал</p>
        <h1>История</h1>
      </div>
    </div>

    <div class="toolbar filters">
      <label class="field compact">
        <span>Месяц</span>
        <input v-model="filters.month" type="month" />
      </label>
      <label class="field compact">
        <span>Обходчик</span>
        <select v-model="filters.personId">
          <option value="all">Все</option>
          <option v-for="person in store.people" :key="person.id" :value="person.id">{{ person.name }}</option>
        </select>
      </label>
      <label class="field compact">
        <span>Запчасть</span>
        <select v-model="filters.partId">
          <option value="all">Все</option>
          <option v-for="part in store.parts" :key="part.id" :value="part.id">{{ part.name }}</option>
        </select>
      </label>
      <label class="field compact">
        <span>Тип</span>
        <select v-model="filters.type">
          <option value="all">Все</option>
          <option v-for="option in movementOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
    </div>

    <div v-if="!filteredMovements.length" class="empty-state">
      <h2>Операций не найдено</h2>
      <p>Измените фильтры или добавьте новую операцию.</p>
    </div>

    <div class="list">
      <article v-for="movement in filteredMovements" :key="movement.id" class="list-row movement-row">
        <div class="movement-main">
          <span class="pill">{{ movementLabels[movement.type] }}</span>
          <h2>{{ partName(store.parts, movement.partId) }}</h2>
          <p>{{ formatDate(movement.date) }} · {{ personName(store.people, movement.personId) }}</p>
          <p v-if="movement.comment" class="muted">{{ movement.comment }}</p>
        </div>
        <div class="row-actions">
          <strong class="amount" :class="{ negative: signedQuantity(movement) < 0 }">
            {{ signedQuantity(movement) > 0 ? '+' : '' }}{{ signedQuantity(movement) }}
          </strong>
          <button class="icon-button" type="button" title="Редактировать" @click="startEdit(movement)">
            <Edit3 :size="18" />
          </button>
          <button class="icon-button danger-action" type="button" title="Удалить" @click="deleting = movement">
            <Trash2 :size="18" />
          </button>
        </div>
      </article>
    </div>

    <div v-if="editing" class="modal-backdrop" role="dialog" aria-modal="true">
      <form class="modal panel form-grid" @submit.prevent="saveEdit">
        <div class="modal-title span-2">
          <h2>Редактировать операцию</h2>
          <button class="icon-button" type="button" title="Закрыть" @click="editing = null">
            <X :size="18" />
          </button>
        </div>
        <label class="field">
          <span>Дата</span>
          <input v-model="editing.date" type="date" required />
        </label>
        <label class="field">
          <span>Тип</span>
          <select v-model="editing.type" required>
            <option v-for="option in movementOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="field">
          <span>Обходчик</span>
          <select v-model="editing.personId" required>
            <option v-for="person in store.people" :key="person.id" :value="person.id">{{ person.name }}</option>
          </select>
        </label>
        <label class="field">
          <span>Запчасть</span>
          <select v-model="editing.partId" required>
            <option v-for="part in store.parts" :key="part.id" :value="part.id">{{ part.name }}</option>
          </select>
        </label>
        <label class="field">
          <span>Количество</span>
          <input v-model.number="editing.quantity" type="number" min="0.001" step="0.001" required />
        </label>
        <label class="field">
          <span>Причина</span>
          <input v-model.trim="editing.reason" type="text" />
        </label>
        <label class="field span-2">
          <span>Комментарий</span>
          <textarea v-model.trim="editing.comment" rows="3"></textarea>
        </label>
        <button class="button primary span-2" type="submit">
          <Save :size="18" />
          <span>Сохранить изменения</span>
        </button>
      </form>
    </div>

    <div v-if="deleting" class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal panel">
        <h2>Удалить операцию?</h2>
        <p>Вы уверены, что хотите удалить эту операцию?</p>
        <div class="modal-actions">
          <button class="button secondary" type="button" @click="deleting = null">Отмена</button>
          <button class="button danger" type="button" @click="confirmDelete">Удалить</button>
        </div>
      </div>
    </div>
  </section>
</template>
