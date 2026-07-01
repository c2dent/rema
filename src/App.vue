<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { Archive, BarChart3, Boxes, ClipboardList, Database, PackagePlus, Users } from 'lucide-vue-next';
import { useInventoryStore } from './stores/inventory';

const store = useInventoryStore();

onMounted(() => {
  void store.loadAll();
});
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/" aria-label="Rema">
        <span class="brand-mark">R</span>
        <span>
          <strong>Rema</strong>
          <small>учет запчастей</small>
        </span>
      </RouterLink>
      <RouterLink class="quick-add" to="/movement">
        <PackagePlus :size="18" />
        <span>Операция</span>
      </RouterLink>
    </header>

    <main class="content">
      <RouterView />
    </main>

    <nav class="bottom-nav" aria-label="Основная навигация">
      <RouterLink to="/">
        <Boxes :size="20" />
        <span>Остатки</span>
      </RouterLink>
      <RouterLink to="/history">
        <ClipboardList :size="20" />
        <span>История</span>
      </RouterLink>
      <RouterLink to="/report">
        <BarChart3 :size="20" />
        <span>Отчет</span>
      </RouterLink>
      <RouterLink to="/parts">
        <Archive :size="20" />
        <span>Запчасти</span>
      </RouterLink>
      <RouterLink to="/people">
        <Users :size="20" />
        <span>Люди</span>
      </RouterLink>
      <RouterLink to="/backup">
        <Database :size="20" />
        <span>Бэкап</span>
      </RouterLink>
    </nav>
  </div>
</template>
