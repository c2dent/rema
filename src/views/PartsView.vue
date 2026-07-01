<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Edit3, PackageCheck, Plus, Save } from 'lucide-vue-next';
import { useInventoryStore } from '../stores/inventory';
import type { Part } from '../db';

const store = useInventoryStore();
const form = reactive({ name: '', unit: 'шт' });
const editingId = ref<string | null>(null);
const editDraft = reactive({ name: '', unit: '', isActive: true });

async function addPart() {
  if (!form.name.trim() || !form.unit.trim()) return;
  await store.addPart({ name: form.name, unit: form.unit });
  form.name = '';
  form.unit = 'шт';
}

function startEdit(part: Part) {
  editingId.value = part.id;
  editDraft.name = part.name;
  editDraft.unit = part.unit;
  editDraft.isActive = part.isActive;
}

async function saveEdit() {
  if (!editingId.value || !editDraft.name.trim() || !editDraft.unit.trim()) return;
  await store.updatePart({ id: editingId.value, ...editDraft });
  editingId.value = null;
}
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Справочник</p>
        <h1>Запчасти</h1>
      </div>
    </div>

    <form class="panel inline-form" @submit.prevent="addPart">
      <label class="field">
        <span>Название</span>
        <input v-model.trim="form.name" type="text" placeholder="Кабель" required />
      </label>
      <label class="field small-field">
        <span>Ед.</span>
        <input v-model.trim="form.unit" type="text" placeholder="шт" required />
      </label>
      <button class="button primary" type="submit">
        <Plus :size="18" />
        <span>Добавить</span>
      </button>
    </form>

    <div v-if="!store.parts.length" class="empty-state">
      <PackageCheck :size="28" />
      <h2>Список пуст</h2>
      <p>Создайте запчасти, чтобы использовать их в операциях и отчетах.</p>
    </div>

    <div class="list">
      <article v-for="part in store.parts" :key="part.id" class="list-row">
        <template v-if="editingId === part.id">
          <div class="edit-grid">
            <label class="field">
              <span>Название</span>
              <input v-model.trim="editDraft.name" type="text" required />
            </label>
            <label class="field small-field">
              <span>Ед.</span>
              <input v-model.trim="editDraft.unit" type="text" required />
            </label>
            <label class="toggle">
              <input v-model="editDraft.isActive" type="checkbox" />
              <span>Активна</span>
            </label>
          </div>
          <div class="row-actions">
            <button class="icon-button primary" type="button" title="Сохранить" @click="saveEdit">
              <Save :size="18" />
            </button>
          </div>
        </template>
        <template v-else>
          <div>
            <h2>{{ part.name }}</h2>
            <p>{{ part.unit }} · {{ part.isActive ? 'активна' : 'скрыта' }}</p>
          </div>
          <div class="row-actions">
            <button class="icon-button" type="button" title="Редактировать" @click="startEdit(part)">
              <Edit3 :size="18" />
            </button>
          </div>
        </template>
      </article>
    </div>
  </section>
</template>
