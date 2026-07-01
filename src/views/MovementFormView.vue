<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Save } from 'lucide-vue-next';
import { useInventoryStore } from '../stores/inventory';
import { currentMonthInputValue, movementOptions } from '../utils/inventory';
import type { MovementType } from '../db';

const store = useInventoryStore();
const router = useRouter();
const error = ref('');

const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  type: 'issue' as MovementType,
  personId: '',
  partId: '',
  quantity: 1,
  reason: '',
  comment: ''
});

const canSubmit = computed(() => Boolean(form.date && form.type && form.personId && form.partId && Number(form.quantity) > 0));

async function saveMovement() {
  error.value = '';
  if (!canSubmit.value) {
    error.value = 'Заполните дату, тип, обходчика, запчасть и положительное количество.';
    return;
  }

  await store.addMovement({ ...form, quantity: Number(form.quantity) });
  await router.push('/');
}
</script>

<template>
  <section class="page form-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">{{ currentMonthInputValue() }}</p>
        <h1>Добавить операцию</h1>
      </div>
    </div>

    <div v-if="!store.activeParts.length || !store.activePeople.length" class="notice">
      Сначала добавьте хотя бы одну активную запчасть и одного обходчика.
    </div>

    <form class="panel form-grid" @submit.prevent="saveMovement">
      <label class="field">
        <span>Дата</span>
        <input v-model="form.date" type="date" required />
      </label>

      <label class="field">
        <span>Тип операции</span>
        <select v-model="form.type" required>
          <option v-for="option in movementOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>Обходчик</span>
        <select v-model="form.personId" required>
          <option value="" disabled>Выберите обходчика</option>
          <option v-for="person in store.activePeople" :key="person.id" :value="person.id">{{ person.name }}</option>
        </select>
      </label>

      <label class="field">
        <span>Запчасть</span>
        <select v-model="form.partId" required>
          <option value="" disabled>Выберите запчасть</option>
          <option v-for="part in store.activeParts" :key="part.id" :value="part.id">
            {{ part.name }} · {{ part.unit }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>Количество</span>
        <input v-model.number="form.quantity" type="number" min="0.001" step="0.001" inputmode="decimal" required />
      </label>

      <label class="field">
        <span>Причина</span>
        <input v-model.trim="form.reason" type="text" placeholder="Наряд, объект, пояснение" />
      </label>

      <label class="field span-2">
        <span>Комментарий</span>
        <textarea v-model.trim="form.comment" rows="4" placeholder="Дополнительные детали"></textarea>
      </label>

      <p v-if="error" class="form-error">{{ error }}</p>

      <button class="button primary span-2" type="submit" :disabled="!canSubmit">
        <Save :size="18" />
        <span>Сохранить операцию</span>
      </button>
    </form>
  </section>
</template>
