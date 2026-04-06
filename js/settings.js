/* ============================================================
   FINANZA PERSONAL — js/settings.js
   Configuración: moneda, perfil, categorías, modo, reseteo
   ============================================================ */

'use strict';

const CURRENCIES = [
  { code:'COP', symbol:'$', locale:'es-CO', label:'🇨🇴 Peso colombiano (COP)' },
  { code:'USD', symbol:'$', locale:'en-US', label:'🇺🇸 Dólar americano (USD)' },
  { code:'EUR', symbol:'€', locale:'es-ES', label:'🇪🇺 Euro (EUR)' },
  { code:'MXN', symbol:'$', locale:'es-MX', label:'🇲🇽 Peso mexicano (MXN)' },
  { code:'ARS', symbol:'$', locale:'es-AR', label:'🇦🇷 Peso argentino (ARS)' },
  { code:'PEN', symbol:'S/.', locale:'es-PE', label:'🇵🇪 Sol peruano (PEN)' },
  { code:'CLP', symbol:'$', locale:'es-CL', label:'🇨🇱 Peso chileno (CLP)' },
  { code:'BRL', symbol:'R$', locale:'pt-BR', label:'🇧🇷 Real brasileño (BRL)' }
];

window.SettingsPage = {

  init() {
    this.render();
  },

  render() {
    const el = document.getElementById('settings-page');
    if (!el) return;

    const settings = DB.get('settings');
    const cats     = DB.get('categories');
    const theme    = settings.theme || 'light';

    el.innerHTML = `
      <div class="page-wrapper">
        <div class="page-header">
          <div class="page-header-info">
            <h1>⚙️ Configuración</h1>
            <p>Personaliza la app a tu gusto</p>
          </div>
        </div>

        <!-- Profile -->
        <div class="card mb-6">
          <div class="card-header"><div class="card-title">👩 Mi perfil</div></div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tu nombre</label>
              <input class="form-control" id="s-name" type="text" value="${settings.userName || 'María'}" placeholder="Tu nombre">
            </div>
            <div class="form-group">
              <label class="form-label">Presupuesto mensual total</label>
              <input class="form-control" id="s-budget" type="number" value="${settings.monthlyBudget || 3500000}" placeholder="3500000" min="0" step="10000">
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SettingsPage.saveProfile()">💾 Guardar perfil</button>
        </div>

        <!-- Currency -->
        <div class="card mb-6">
          <div class="card-header"><div class="card-title">💱 Moneda</div></div>
          <div class="form-group">
            <label class="form-label">Selecciona tu moneda</label>
            <select class="form-control" id="s-currency">
              ${CURRENCIES.map(c => `<option value="${c.code}" ${settings.currency===c.code?'selected':''}>${c.label}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SettingsPage.saveCurrency()">💾 Guardar moneda</button>
        </div>

        <!-- Theme -->
        <div class="card mb-6">
          <div class="card-header"><div class="card-title">🎨 Apariencia</div></div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button class="btn ${theme==='light'?'btn-primary':'btn-secondary'}" id="btn-light" onclick="SettingsPage.setTheme('light')">
              ☀️ Modo claro
            </button>
            <button class="btn ${theme==='dark'?'btn-primary':'btn-secondary'}" id="btn-dark" onclick="SettingsPage.setTheme('dark')">
              🌙 Modo oscuro
            </button>
          </div>
        </div>

        <!-- Categories -->
        <div class="card mb-6">
          <div class="card-header">
            <div class="card-title">📂 Categorías</div>
            <button class="btn btn-sm btn-primary" onclick="SettingsPage.addCategory()">➕ Agregar</button>
          </div>
          <div id="cats-list" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px">
            ${cats.map(c => this.renderCatChip(c)).join('')}
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card" style="border-color:var(--danger-dark)">
          <div class="card-header"><div class="card-title" style="color:var(--danger-dark)">⚠️ Zona de peligro</div></div>
          <p class="text-sm text-muted mb-4">Estas acciones no se pueden deshacer. Ten cuidado.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-danger btn-sm" onclick="SettingsPage.resetData()">🔄 Restablecer datos demo</button>
            <button class="btn btn-danger btn-sm" onclick="SettingsPage.clearAll()">🗑️ Borrar TODOS los datos</button>
          </div>
        </div>

        <!-- Add Category Modal -->
        <div class="modal-overlay hidden" id="add-cat-modal">
          <div class="modal" style="max-width:380px">
            <div class="modal-header">
              <h3>➕ Nueva categoría</h3>
              <button class="modal-close" onclick="closeModal('add-cat-modal')">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nombre <span>*</span></label>
                <input class="form-control" id="new-cat-name" type="text" placeholder="Ej: Mascotas">
              </div>
              <div class="form-group">
                <label class="form-label">Ícono (emoji)</label>
                <input class="form-control" id="new-cat-icon" type="text" placeholder="🐾" maxlength="4" style="font-size:1.5rem;width:80px;text-align:center">
              </div>
              <div class="form-group">
                <label class="form-label">Color</label>
                <input class="form-control" id="new-cat-color" type="color" value="#C084FC" style="height:44px;cursor:pointer">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="closeModal('add-cat-modal')">Cancelar</button>
              <button class="btn btn-primary" onclick="SettingsPage.saveCategory()">💾 Guardar</button>
            </div>
          </div>
        </div>
      </div>`;
  },

  renderCatChip(c) {
    const isDefault = ['comida','arriendo','internet','servicios','transporte','salud','educacion','hogar','ropa','entretenimiento','gastos_fijos','gastos_variables','ahorro','deudas','otros','ingreso'].includes(c.id);
    return `
      <div style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;background:${c.bg||'var(--bg)'};border-radius:var(--radius-full);border:1px solid ${c.color}22;font-size:.82rem;font-weight:700">
        <span>${c.icon}</span>
        <span style="color:${c.color}">${c.name}</span>
        ${!isDefault ? `<button onclick="SettingsPage.deleteCategory('${c.id}')" style="background:none;border:none;cursor:pointer;font-size:.75rem;color:var(--muted);margin-left:2px;line-height:1" title="Eliminar">✕</button>` : ''}
      </div>`;
  },

  saveProfile() {
    const name   = document.getElementById('s-name')?.value?.trim();
    const budget = parseFloat(document.getElementById('s-budget')?.value) || 3500000;
    if (name) DB.setSetting('userName', name);
    DB.setSetting('monthlyBudget', budget);
    renderSidebar();
    showToast('Perfil guardado 💜', 'success');
  },

  saveCurrency() {
    const code = document.getElementById('s-currency')?.value;
    const cur  = CURRENCIES.find(c => c.code === code);
    if (!cur) return;
    DB.setSetting('currency',       cur.code);
    DB.setSetting('currencySymbol', cur.symbol);
    DB.setSetting('currencyLocale', cur.locale);
    showToast(`Moneda cambiada a ${cur.code} 💱`, 'success');
  },

  setTheme(theme) {
    applyTheme(theme);
    document.getElementById('btn-light')?.classList.toggle('btn-primary',  theme==='light');
    document.getElementById('btn-light')?.classList.toggle('btn-secondary',theme!=='light');
    document.getElementById('btn-dark')?.classList.toggle('btn-primary',   theme==='dark');
    document.getElementById('btn-dark')?.classList.toggle('btn-secondary', theme!=='dark');
    showToast(theme==='dark' ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado', 'success');
  },

  addCategory() {
    document.getElementById('new-cat-name').value  = '';
    document.getElementById('new-cat-icon').value  = '⭐';
    document.getElementById('new-cat-color').value = '#C084FC';
    openModal('add-cat-modal');
  },

  saveCategory() {
    const name  = document.getElementById('new-cat-name')?.value?.trim();
    const icon  = document.getElementById('new-cat-icon')?.value?.trim() || '⭐';
    const color = document.getElementById('new-cat-color')?.value || '#C084FC';
    if (!name) { showToast('Escribe el nombre', 'error'); return; }
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const cats = DB.get('categories');
    if (cats.find(c => c.id === id)) { showToast('Ya existe esa categoría', 'error'); return; }
    cats.push({ id, name, icon, color, bg: color + '22' });
    DB.set('categories', cats);
    closeModal('add-cat-modal');
    showToast(`Categoría "${name}" creada ✨`, 'success');
    this.render();
  },

  deleteCategory(id) {
    if (!confirm(`¿Eliminar esta categoría?`)) return;
    const cats = DB.get('categories').filter(c => c.id !== id);
    DB.set('categories', cats);
    showToast('Categoría eliminada', 'warning');
    this.render();
  },

  resetData() {
    if (!confirm('¿Borrar todos los datos y empezar desde cero?')) return;
    DB.reset();
    showToast('Datos borrados. ¡Empieza desde cero! ✨', 'success');
    navigateTo('dashboard');
  },

  clearAll() {
    if (!confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
    if (!confirm('¿Estás completamente segura? Se borrarán todos los movimientos, metas y presupuestos.')) return;
    localStorage.removeItem('finanza_personal_v1');
    location.reload();
  }
};
