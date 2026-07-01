<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Edit3, Plus, Save, UserRoundCheck } from 'lucide-vue-next';
import { useInventoryStore } from '../stores/inventory';
import type { Person } from '../db';

const store = useInventoryStore();
const form = reactive({ name: '', phone: '', comment: '' });
const editingId = ref<string | null>(null);
const editDraft = reactive({ name: '', phone: '', comment: '', isActive: true });

async function addPerson() {
  if (!form.name.trim()) return;
  await store.addPerson({ ...form });
  form.name = '';
  form.phone = '';
  form.comment = '';
}

function startEdit(person: Person) {
  editingId.value = person.id;
  editDraft.name = person.name;
  editDraft.phone = person.phone;
  editDraft.comment = person.comment;
  editDraft.isActive = person.isActive;
}

async function saveEdit() {
  if (!editingId.value || !editDraft.name.trim()) return;
  await store.updatePerson({ id: editingId.value, ...editDraft });
  editingId.value = null;
}
</script>

<template>
  <section class="page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Справочник</p>
        <h1>Обходчики</h1>
      </div>
    </div>

    <form class="panel form-grid" @submit.prevent="addPerson">
      <label class="field">
        <span>Имя</span>
        <input v-model.trim="form.name" type="text" placeholder="Имя обходчика" required />
      </label>
      <label class="field">
        <span>Телефон</span>
        <input v-model.trim="form.phone" type="tel" placeholder="+993..." />
      </label>
      <label class="field span-2">
        <span>Комментарий</span>
        <textarea v-model.trim="form.comment" rows="3"></textarea>
      </label>
      <button class="button primary span-2" type="submit">
        <Plus :size="18" />
        <span>Добавить обходчика</span>
      </button>
    </form>

    <div v-if="!store.people.length" class="empty-state">
      <UserRoundCheck :size="28" />
      <h2>Список пуст</h2>
      <p>Добавьте обходчиков, чтобы выбирать их в операциях и отчетах.</p>
    </div>

    <div class="list">
      <article v-for="person in store.people" :key="person.id" class="list-row">
        <template v-if="editingId === person.id">
          <div class="edit-grid wide">
            <label class="field">
              <span>Имя</span>
              <input v-model.trim="editDraft.name" type="text" required />
            </label>
            <label class="field">
              <span>Телефон</span>
              <input v-model.trim="editDraft.phone" type="tel" />
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
            <h2>{{ person.name }}</h2>
            <p>{{ person.phone || 'телефон не указан' }} · {{ person.isActive ? 'активен' : 'скрыт' }}</p>
            <p v-if="person.comment" class="muted">{{ person.comment }}</p>
          </div>
          <div class="row-actions">
            <button class="icon-button" type="button" title="Редактировать" @click="startEdit(person)">
              <Edit3 :size="18" />
            </button>
          </div>
        </template>
      </article>
    </div>
  </section>
</template>
