/* ============================================================
   FINANZA PERSONAL — js/movements.js
   CRUD completo de movimientos + filtros + modal
   ============================================================ */

'use strict';

window.MovementsPage = {

  filters: { type: '', category: '', search: '', dateFrom: '', dateTo: '' },
  editingId: null,

  init() {
    this.render();
  },

  render() {
    const el = document.getElementById('movements-page');
    if (!el) return;

    const { selectedYear: year, selectedMonth: month } = AppState;
    const name = getMonthName(month) + ' ' + year;
    const movs = this.getFiltered();
    const totals = movs.reduce((a, m) => {
      if (m.type === 'income')  a.income  += m.amount;
      if (m.type === 'expense') a.expense += m.amount;
      return a;
    }, { income: 0, expense: 0 });

    el.innerHTML = `
      <div class="page-wrapper">
        <!-- Header -->
        <div class="page-header">
          <div class="page-header-info">
            <h1>💸 Movimientos</h1>
            <p>Todos tus ingresos y gastos de <strong>${name}</strong></p>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-income" onclick="MovementsPage.openAdd('income')">➕ Agregar ingreso</button>
            <button class="btn btn-expense" onclick="MovementsPage.openAdd('expense')">➖ Agregar gasto</button>
          </div>
        </div>

        <!-- Quick KPIs -->
        <div class="grid grid-3 mb-6">
          <div class="card" style="text-align:center;padding:16px">
            <div class="text-xs text-muted font-bold mb-1" style="text-transform:uppercase;letter-spacing:.06em">INGRESOS</div>
            <div style="font-size:1.4rem;font-weight:800;color:#059669">${formatCurrency(totals.income)}</div>
          </div>
          <div class="card" style="text-align:center;padding:16px">
            <div class="text-xs text-muted font-bold mb-1" style="text-transform:uppercase;letter-spacing:.06em">GASTOS</div>
            <div style="font-size:1.4rem;font-weight:800;color:#BE185D">${formatCurrency(totals.expense)}</div>
          </div>
          <div class="card" style="text-align:center;padding:16px">
            <div class="text-xs text-muted font-bold mb-1" style="text-transform:uppercase;letter-spacing:.06em">BALANCE</div>
            <div style="font-size:1.4rem;font-weight:800;color:${totals.income - totals.expense >= 0 ? '#059669' : '#DC2626'}">${formatCurrency(totals.income - totals.expense)}</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-bar">
          <div class="search-input-wrap">
            <span>🔍</span>
            <input type="text" id="filter-search" placeholder="Buscar movimientos..." value="${this.filters.search}"
              oninput="MovementsPage.setFilter('search', this.value)">
          </div>
          <div class="filter-group">
            <label>Tipo</label>
            <select id="filter-type" onchange="MovementsPage.setFilter('type', this.value)">
              <option value="">Todos</option>
              <option value="income"  ${this.filters.type==='income' ?'selected':''}>Ingresos</option>
              <option value="expense" ${this.filters.type==='expense'?'selected':''}>Gastos</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Categoría</label>
            <select id="filter-category" onchange="MovementsPage.setFilter('category', this.value)">
              <option value="">Todas</option>
              ${DB.get('categories').map(c => `<option value="${c.id}" ${this.filters.category===c.id?'selected':''}>${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label>Desde</label>
            <input type="date" id="filter-from" value="${this.filters.dateFrom}" onchange="MovementsPage.setFilter('dateFrom', this.value)">
          </div>
          <div class="filter-group">
            <label>Hasta</label>
            <input type="date" id="filter-to" value="${this.filters.dateTo}" onchange="MovementsPage.setFilter('dateTo', this.value)">
          </div>
          <button class="btn btn-ghost btn-sm" onclick="MovementsPage.clearFilters()">✖ Limpiar</button>
        </div>

        <!-- List -->
        <div id="movements-list">${this.renderList(movs)}</div>

        <!-- Modal -->
        ${this.renderModal()}
      </div>`;
  },

  renderList(movs) {
    if (!movs.length) {
      return `<div class="empty-state">
        <span class="empty-icon">💸</span>
        <h3>Sin movimientos</h3>
        <p>Agrega tu primer ingreso o gasto para empezar a llevar el control.</p>
        <button class="btn btn-primary mt-4" onclick="MovementsPage.openAdd('expense')">➕ Agregar gasto</button>
      </div>`;
    }

    // Group by date
    const groups = {};
    movs.forEach(m => {
      const d = m.date;
      if (!groups[d]) groups[d] = [];
      groups[d].push(m);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => `
      <div style="margin-bottom:20px">
        <div style="font-size:.78rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;padding:0 4px;margin-bottom:8px">
          ${formatDate(date)}
        </div>
        ${items.map(m => this.renderMovementItem(m)).join('')}
      </div>
    `).join('');
  },

  renderMovementItem(m) {
    const cat  = getCategoryById(m.category);
    const sign = m.type === 'income' ? '+' : '-';
    return `
      <div class="movement-item" id="mov-${m.id}">
        <div class="movement-icon-wrap" style="background:${cat?.bg || '#f5f5f5'}">${cat?.icon || '💸'}</div>
        <div class="movement-info">
          <div class="movement-desc">${m.description}</div>
          <div class="movement-meta">
            <span class="cat-badge" style="background:${cat?.bg};color:${cat?.color}">${cat?.name}</span>
            <span>${m.paymentMethod}</span>
            ${m.isFixed ? '<span class="badge badge-neutral">Fijo</span>' : ''}
          </div>
        </div>
        <div class="movement-amount ${m.type}">${sign}${formatCurrency(m.amount)}</div>
        <div class="movement-actions">
          <button class="btn btn-ghost btn-icon" title="Editar" onclick="MovementsPage.openEdit(${m.id})">✏️</button>
          <button class="btn btn-ghost btn-icon" title="Eliminar" onclick="MovementsPage.deleteMovement(${m.id})">🗑️</button>
        </div>
      </div>`;
  },

  // ── Filters ──
  setFilter(key, value) {
    this.filters[key] = value;
    const list = document.getElementById('movements-list');
    if (list) list.innerHTML = this.renderList(this.getFiltered());
  },

  clearFilters() {
    this.filters = { type: '', category: '', search: '', dateFrom: '', dateTo: '' };
    this.render();
  },

  getFiltered() {
    const { selectedYear: year, selectedMonth: month } = AppState;
    const f = this.filters;
    return DB.getMovements({
      year, month,
      type:     f.type     || undefined,
      category: f.category || undefined,
      search:   f.search   || undefined,
      dateFrom: f.dateFrom || undefined,
      dateTo:   f.dateTo   || undefined
    });
  },

  // ── Modal ──
  renderModal() {
    const cats = DB.get('categories').filter(c => c.id !== 'ingreso');
    return `
      <div class="modal-overlay hidden" id="movement-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 id="modal-title">➕ Nuevo Movimiento</h3>
            <button class="modal-close" onclick="closeModal('movement-modal')">✕</button>
          </div>
          <div class="modal-body">
            <!-- Type Toggle -->
            <div class="type-toggle" id="type-toggle">
              <button class="type-toggle-btn active-income" id="toggle-income" onclick="MovementsPage.setType('income')">💵 Ingreso</button>
              <button class="type-toggle-btn" id="toggle-expense" onclick="MovementsPage.setType('expense')">💳 Gasto</button>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Monto <span>*</span></label>
                <input class="form-control" type="number" id="mov-amount" placeholder="0" min="0" step="1000">
              </div>
              <div class="form-group">
                <label class="form-label">Fecha <span>*</span></label>
                <input class="form-control" type="date" id="mov-date" value="${new Date().toISOString().split('T')[0]}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Descripción <span>*</span></label>
              <input class="form-control" type="text" id="mov-desc" placeholder="Ej: Mercado del mes, Salario...">
            </div>

            <div class="form-group" id="cat-group">
              <label class="form-label">Categoría</label>
              <select class="form-control" id="mov-category">
                ${cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Método de pago</label>
              <select class="form-control" id="mov-payment">
                ${PAYMENT_METHODS.map(m => `<option value="${m}">${m}</option>`).join('')}
              </select>
            </div>

            <div class="form-group" style="display:flex;align-items:center;gap:10px">
              <input type="checkbox" id="mov-fixed" style="width:18px;height:18px;accent-color:var(--primary);cursor:pointer">
              <label for="mov-fixed" class="form-label" style="margin:0;cursor:pointer">Gasto/ingreso fijo mensual</label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('movement-modal')">Cancelar</button>
            <button class="btn btn-primary" id="save-movement-btn" onclick="MovementsPage.save()">💾 Guardar</button>
          </div>
        </div>
      </div>`;
  },

  _currentType: 'expense',

  setType(type) {
    this._currentType = type;
    const iBtn = document.getElementById('toggle-income');
    const eBtn = document.getElementById('toggle-expense');
    const catG = document.getElementById('cat-group');
    if (iBtn) { iBtn.className = 'type-toggle-btn' + (type === 'income'  ? ' active-income'  : ''); }
    if (eBtn) { eBtn.className = 'type-toggle-btn' + (type === 'expense' ? ' active-expense' : ''); }
    if (catG) catG.style.display = type === 'income' ? 'none' : '';
  },

  openAdd(type = 'expense') {
    this.editingId = null;
    this._currentType = type;

    const title = document.getElementById('modal-title');
    if (title) title.textContent = type === 'income' ? '➕ Nuevo ingreso' : '➕ Nuevo gasto';
    this.clearForm();
    this.setType(type);
    openModal('movement-modal');
  },

  openEdit(id) {
    const m = DB.get('movements').find(mv => mv.id === id);
    if (!m) return;
    this.editingId = id;
    this._currentType = m.type;

    const title = document.getElementById('modal-title');
    if (title) title.textContent = '✏️ Editar movimiento';

    this.setType(m.type);
    document.getElementById('mov-amount').value   = m.amount;
    document.getElementById('mov-date').value     = m.date;
    document.getElementById('mov-desc').value     = m.description;
    document.getElementById('mov-category').value = m.category;
    document.getElementById('mov-payment').value  = m.paymentMethod;
    document.getElementById('mov-fixed').checked  = m.isFixed;
    openModal('movement-modal');
  },

  clearForm() {
    ['mov-amount', 'mov-desc'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const d = document.getElementById('mov-date'); if (d) d.value = new Date().toISOString().split('T')[0];
    const cat = document.getElementById('mov-category'); if (cat) cat.selectedIndex = 0;
    const pay = document.getElementById('mov-payment'); if (pay) pay.selectedIndex = 0;
    const fix = document.getElementById('mov-fixed'); if (fix) fix.checked = false;
  },

  save() {
    const amount = parseFloat(document.getElementById('mov-amount')?.value);
    const desc   = document.getElementById('mov-desc')?.value?.trim();
    const date   = document.getElementById('mov-date')?.value;
    const cat    = this._currentType === 'income' ? 'ingreso' : (document.getElementById('mov-category')?.value || 'otros');
    const pay    = document.getElementById('mov-payment')?.value || 'Efectivo';
    const fixed  = document.getElementById('mov-fixed')?.checked || false;

    if (!amount || amount <= 0) { showToast('Ingresa un monto válido', 'error'); return; }
    if (!desc)    { showToast('Escribe una descripción', 'error'); return; }
    if (!date)    { showToast('Selecciona una fecha', 'error'); return; }

    const data = { type: this._currentType, amount, description: desc, date, category: cat, paymentMethod: pay, isFixed: fixed };

    if (this.editingId) {
      DB.updateMovement(this.editingId, data);
      showToast('Movimiento actualizado ✨', 'success');
    } else {
      DB.addMovement(data);
      showToast('¡Movimiento guardado! 💜', 'success');
    }

    closeModal('movement-modal');
    this.render();
  },

  deleteMovement(id) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    DB.deleteMovement(id);
    showToast('Movimiento eliminado', 'warning');
    this.render();
  }
};
