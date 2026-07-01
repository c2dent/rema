import { createRouter, createWebHashHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import MovementFormView from '../views/MovementFormView.vue';
import HistoryView from '../views/HistoryView.vue';
import PartsView from '../views/PartsView.vue';
import PeopleView from '../views/PeopleView.vue';
import MonthlyReportView from '../views/MonthlyReportView.vue';
import BackupView from '../views/BackupView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/movement', name: 'movement', component: MovementFormView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/parts', name: 'parts', component: PartsView },
    { path: '/people', name: 'people', component: PeopleView },
    { path: '/report', name: 'report', component: MonthlyReportView },
    { path: '/backup', name: 'backup', component: BackupView }
  ]
});

export default router;
