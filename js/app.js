/* ============================================================
   FINANZA PERSONAL — js/app.js
   Router SPA, layout, sidebar, modo oscuro, toast
   ============================================================ */

'use strict';

// ── State ────────────────────────────────────────────────────
const AppState = {
  currentPage: 'dashboard',
  selectedYear:  new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),
  sidebarOpen: false
};

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Limpiar versiones antiguas para forzar datos actualizados
  ['finanza_personal_v1', 'finanza_personal_v2'].forEach(k => localStorage.removeItem(k));

  DB.load();
  applyTheme(DB.getSetting('theme') || 'light');
  renderSidebar();
  renderTopbar();
  initRouter();
  bindGlobalEvents();
});

// ── Router ───────────────────────────────────────────────────
const PAGES = {
  dashboard:  { label: 'Dashboard',     icon: '🏠', file: 'pages/dashboard.html',   loader: () => window.DashboardPage?.init() },
  movements:  { label: 'Movimientos',   icon: '💸', file: 'pages/movements.html',  loader: () => window.MovementsPage?.init() },
  budget:     { label: 'Presupuesto',   icon: '📊', file: 'pages/budget.html',     loader: () => window.BudgetPage?.init() },
  savings:    { label: 'Ahorros',       icon: '🎯', file: 'pages/savings.html',    loader: () => window.SavingsPage?.init() },
  analysis:   { label: 'Análisis',      icon: '🧠', file: 'pages/analysis.html',   loader: () => window.AnalysisPage?.init() },
  reports:    { label: 'Reportes',      icon: '📄', file: 'pages/reports.html',    loader: () => window.ReportsPage?.init() },
  fixed:      { label: 'Gastos Fijos',  icon: '📋', file: 'pages/fixed-expenses.html', loader: () => window.FixedPage?.init() },
  settings:   { label: 'Configuración', icon: '⚙️', file: 'pages/settings.html',   loader: () => window.SettingsPage?.init() }
};

function initRouter() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  navigateTo(hash);
  window.addEventListener('hashchange', () => {
    const page = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(page);
  });
}

function navigateTo(page) {
  if (!PAGES[page]) page = 'dashboard';
  AppState.currentPage = page;
  const info = PAGES[page];
  const content = document.getElementById('page-content');
  if (!content) return;

  content.innerHTML = '<div class="spinner"></div>';

  fetch(info.file)
    .then(r => { if (!r.ok) throw new Error('Not found'); return r.text(); })
    .then(html => {
      content.innerHTML = html;
      updateSidebarActive(page);
      // Call page init after a tiny delay to ensure DOM is ready
      setTimeout(() => info.loader?.(), 50);
    })
    .catch(() => {
      content.innerHTML = `<div class="page-wrapper"><div class="empty-state"><span class="empty-icon">😞</span><h3>Página no encontrada</h3><p>Esta sección está en construcción.</p></div></div>`;
    });

  // Close sidebar on mobile
  if (window.innerWidth <= 768) closeSidebar();
}

// ── Sidebar ──────────────────────────────────────────────────
function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const name = DB.getSetting('userName') || 'María';
  const now = new Date();

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon">💜</div>
      <div class="sidebar-brand-text">
        <h2>Finanza</h2>
        <span>Control de tu dinero</span>
      </div>
    </div>

    <div class="sidebar-user">
      <div class="user-avatar">${name.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <strong>${name}</strong>
        <span>Mi dinero 💕</span>
      </div>
    </div>

    <div class="sidebar-month">
      <label>📅 Mes activo</label>
      <select id="month-selector">${buildMonthOptions()}</select>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-label">principal</div>
      ${buildNavItem('dashboard',  '🏠', 'Dashboard')}
      ${buildNavItem('movements',  '💸', 'Movimientos')}
      ${buildNavItem('budget',     '📊', 'Presupuesto')}
      ${buildNavItem('savings',    '🎯', 'Ahorros')}
      ${buildNavItem('analysis',   '🧠', 'Análisis')}
      ${buildNavItem('reports',    '📄', 'Reportes')}
      ${buildNavItem('fixed',      '📋', 'Gastos Fijos')}

      <div class="nav-section-label" style="margin-top:8px">ajustes</div>
      ${buildNavItem('settings',   '⚙️', 'Configuración')}
    </nav>

    <div class="sidebar-footer">
      <div class="nav-item" id="theme-toggle-btn" onclick="toggleTheme()">
        <div class="nav-item-icon" id="theme-icon">🌙</div>
        <span class="nav-item-label" id="theme-label">Modo oscuro</span>
      </div>
    </div>
  `;

  // Month selector
  const sel = document.getElementById('month-selector');
  if (sel) {
    const idx = AppState.selectedYear * 12 + AppState.selectedMonth;
    sel.value = idx;
    sel.addEventListener('change', (e) => {
      const val = parseInt(e.target.value);
      AppState.selectedYear  = Math.floor(val / 12);
      AppState.selectedMonth = val % 12;
      PAGES[AppState.currentPage]?.loader?.();
    });
  }

  updateThemeButton();
}

function buildMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 11; i >= -2; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = d.getFullYear() * 12 + d.getMonth();
    const label = `${getMonthName(d.getMonth())} ${d.getFullYear()}`;
    const sel = (d.getFullYear() === AppState.selectedYear && d.getMonth() === AppState.selectedMonth) ? 'selected' : '';
    opts.push(`<option value="${val}" ${sel}>${label}</option>`);
  }
  return opts.join('');
}

function buildNavItem(page, icon, label) {
  return `
    <a class="nav-item" href="#${page}" data-page="${page}">
      <div class="nav-item-icon">${icon}</div>
      <span class="nav-item-label">${label}</span>
    </a>`;
}

function updateSidebarActive(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('visible');
  AppState.sidebarOpen = true;
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('visible');
  AppState.sidebarOpen = false;
}

// ── Topbar (mobile) ──────────────────────────────────────────
function renderTopbar() {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;
  topbar.innerHTML = `
    <button class="hamburger-btn" id="hamburger-btn" onclick="openSidebar()">☰</button>
    <div class="topbar-brand">
      <span>💜</span><span>Finanza</span>
    </div>
    <button class="btn btn-icon btn-ghost" onclick="openModal('movement-modal')">➕</button>
  `;
}

// ── Theme ────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  DB.setSetting('theme', theme);
  updateThemeButton();
}

function toggleTheme() {
  const current = DB.getSetting('theme') || 'light';
  applyTheme(current === 'light' ? 'dark' : 'light');
}

function updateThemeButton() {
  const icon  = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  const theme = DB.getSetting('theme') || 'light';
  if (icon)  icon.textContent  = theme === 'light' ? '🌙' : '☀️';
  if (label) label.textContent = theme === 'light' ? 'Modo oscuro' : 'Modo claro';
}

// ── Modal Helpers ─────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: '💜' };
  toast.textContent = `${icons[type] || '💜'} ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ── Global Events ─────────────────────────────────────────────
function bindGlobalEvents() {
  // Overlay click closes sidebar
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

  // Close modals on overlay click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.add('hidden');
    }
  });

  // Keyboard ESC closes modals and sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
      if (AppState.sidebarOpen) closeSidebar();
    }
  });
}

// ── Expose globals ────────────────────────────────────────────
window.AppState     = AppState;
window.navigateTo   = navigateTo;
window.openModal    = openModal;
window.closeModal   = closeModal;
window.showToast    = showToast;
window.toggleTheme  = toggleTheme;
window.openSidebar  = openSidebar;
window.closeSidebar = closeSidebar;
window.renderSidebar = renderSidebar;
window.PAGES        = PAGES;
