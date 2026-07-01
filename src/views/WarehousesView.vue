<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Edit3, Plus, Save, Warehouse as WarehouseIcon } from 'lucide-vue-next';
import { useInventoryStore } from '../stores/inventory';
import type { Warehouse } from '../db';

const store = useInventoryStore();
const form = reactive({ name: '', comment: '' });
const editingId = ref<string | null>(null);
const editDraft = reactive({ name: '', comment: '', isActive: true });

async function addWarehouse() {
  if (!form.name.trim()) return;
  await store.addWarehouse({ ...form });
  form.name = '';
  form.comment = '';
}

function startEdit(warehouse: Warehouse) {
  editingId.value = warehouse.id;
  editDraft.name = warehouse.name;
  editDraft.comment = warehouse.comment;
  editDraft.isActive = warehouse.isActive;
}

async function saveEdit() {
  if (!editingId.value || !editDraft.name.trim()) return;
  await store.updateWarehouse({ id: editingId.value, ...editDraft });
  editingId.value = null;
}
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Справочник</p>
        <h1>Склады</h1>
      </div>
    </div>

    <form class="panel form-grid" @submit.prevent="addWarehouse">
      <label class="field">
        <span>Название</span>
        <input v-model.trim="form.name" type="text" placeholder="Основной склад" required />
      </label>
      <label class="field">
        <span>Комментарий</span>
        <input v-model.trim="form.comment" type="text" placeholder="Адрес или примечание" />
      </label>
      <button class="button primary span-2" type="submit">
        <Plus :size="18" />
        <span>Добавить склад</span>
      </button>
    </form>

    <div v-if="!store.warehouses.length" class="empty-state">
      <WarehouseIcon :size="28" />
      <h2>Список пуст</h2>
      <p>Основной склад создается автоматически при запуске приложения.</p>
    </div>

    <div class="list">
      <article v-for="warehouse in store.warehouses" :key="warehouse.id" class="list-row">
        <template v-if="editingId === warehouse.id">
          <div class="edit-grid wide">
            <label class="field">
              <span>Название</span>
              <input v-model.trim="editDraft.name" type="text" required />
            </label>
            <label class="field">
              <span>Комментарий</span>
              <input v-model.trim="editDraft.comment" type="text" />
            </label>
            <label class="toggle">
              <input v-model="editDraft.isActive" type="checkbox" />
              <span>Активен</span>
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
            <h2>{{ warehouse.name }}</h2>
            <p>{{ warehouse.isActive ? 'активен' : 'скрыт' }}</p>
            <p v-if="warehouse.comment" class="muted">{{ warehouse.comment }}</p>
          </div>
          <div class="row-actions">
            <button class="icon-button" type="button" title="Редактировать" @click="startEdit(warehouse)">
              <Edit3 :size="18" />
            </button>
          </div>
        </template>
      </article>
    </div>
  </section>
</template>
