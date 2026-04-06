/* ============================================================
   FINANZA PERSONAL — js/budget.js
   Presupuesto mensual por categoría + barras de progreso
   ============================================================ */

'use strict';

window.BudgetPage = {

  init() {
    this.render();
  },

  render() {
    const el = document.getElementById('budget-page');
    if (!el) return;

    const { selectedYear: year, selectedMonth: month } = AppState;
    const movs    = DB.getMovements({ year, month, type: 'expense' });
    const catSpent = calcCategoryTotals(movs);
    const budgets  = DB.get('budgets');
    const cats     = DB.get('categories').filter(c => c.id !== 'ingreso');

    const totalBudget  = Object.values(budgets).reduce((a, b) => a + b, 0);
    const totalSpent   = Object.values(catSpent).reduce((a, b) => a + b, 0);
    const totalLeft    = Math.max(0, totalBudget - totalSpent);
    const globalPct    = totalBudget > 0 ? Math.min(100, Math.round(totalSpent / totalBudget * 100)) : 0;

    const alertCats = cats.filter(c => {
      const b = budgets[c.id] || 0;
      const s = catSpent[c.id] || 0;
      return b > 0 && s / b > 0.85;
    });

    el.innerHTML = `
      <div class="page-wrapper">
        <div class="page-header">
          <div class="page-header-info">
            <h1>📊 Presupuesto</h1>
            <p>Control de gastos por categoría — ${getMonthName(month)} ${year}</p>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-primary" onclick="BudgetPage.openEdit()">⚙️ Editar presupuestos</button>
          </div>
        </div>

        <!-- Global summary -->
        <div class="card mb-6" style="background:linear-gradient(135deg,var(--primary-light),var(--secondary-light))">
          <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;margin-bottom:16px">
            <div>
              <div class="text-xs text-muted font-bold mb-1" style="text-transform:uppercase;letter-spacing:.06em">Presupuesto total del mes</div>
              <div style="font-size:2rem;font-weight:800;color:var(--text)">${formatCurrency(totalBudget)}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:1.3rem;font-weight:800;color:${globalPct>100?'var(--danger-dark)':'var(--primary-dark)'}">${globalPct}% usado</div>
              <div class="text-sm text-muted">Quedan ${formatCurrency(totalLeft)}</div>
            </div>
          </div>
          <div class="progress-bar-bg" style="height:14px">
            <div class="progress-bar-fill ${globalPct>100?'danger':globalPct>85?'warning':''}" style="width:${Math.min(100,globalPct)}%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:.78rem;color:var(--muted);font-weight:600">
            <span>Gastado: ${formatCurrency(totalSpent)}</span>
            <span>Presupuestado: ${formatCurrency(totalBudget)}</span>
          </div>
        </div>

        <!-- Alerts -->
        ${alertCats.length ? `
        <div class="mb-6">
          ${alertCats.map(c => {
            const b = budgets[c.id]; const s = catSpent[c.id] || 0;
            const pct = Math.round(s/b*100);
            const over = s > b;
            return `<div class="alert ${over?'alert-danger':'alert-warning'}">
              <span class="alert-icon">${over?'🚨':'⚠️'}</span>
              <div class="alert-body">
                <strong>${over?'Límite superado':'Cerca del límite'}: ${c.icon} ${c.name}</strong>
                <p>Gastaste ${formatCurrency(s)} de ${formatCurrency(b)} (${pct}% del presupuesto)</p>
              </div>
            </div>`;
          }).join('')}
        </div>` : ''}

        <!-- Category bars -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📋 Por categoría</div>
          </div>
          <div id="budget-bars">
            ${cats.map(c => this.renderCategoryBar(c, catSpent[c.id]||0, budgets[c.id]||0)).join('')}
          </div>
        </div>

        <!-- Edit Modal -->
        ${this.renderModal(cats, budgets)}
      </div>`;
  },

  renderCategoryBar(cat, spent, budget) {
    if (budget === 0 && spent === 0) return '';
    const pct = budget > 0 ? Math.min(100, Math.round(spent / budget * 100)) : 0;
    const left = Math.max(0, budget - spent);
    const barClass = pct > 100 ? 'danger' : pct > 85 ? 'warning' : '';

    return `
      <div class="progress-wrap">
        <div class="progress-header">
          <div class="progress-label">
            <span style="font-size:1.1rem">${cat.icon}</span>
            <span>${cat.name}</span>
            ${budget === 0 ? '<span class="badge badge-neutral text-xs">Sin presupuesto</span>' : ''}
          </div>
          <div class="progress-amounts">
            <span style="color:${pct>100?'var(--danger-dark)':'var(--text)'};font-weight:700">${formatCurrency(spent)}</span>
            ${budget > 0 ? ` / <span class="text-muted">${formatCurrency(budget)}</span>` : ''}
          </div>
        </div>
        ${budget > 0 ? `
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${barClass}" style="width:${pct}%"></div>
        </div>
        <div class="progress-percent" style="color:${pct>85?'var(--danger-dark)':'var(--muted)'}">
          ${pct}% — ${pct < 100 ? `Quedan ${formatCurrency(left)}` : 'Límite superado'}
        </div>` : ''}
      </div>`;
  },

  renderModal(cats, budgets) {
    return `
      <div class="modal-overlay hidden" id="budget-modal">
        <div class="modal" style="max-width:580px">
          <div class="modal-header">
            <h3>⚙️ Editar Presupuestos</h3>
            <button class="modal-close" onclick="closeModal('budget-modal')">✕</button>
          </div>
          <div class="modal-body" style="max-height:60vh;overflow-y:auto">
            <p class="text-sm text-muted mb-4">Define cuánto puedes gastar en cada categoría este mes.</p>
            ${cats.map(c => `
              <div class="form-group" style="display:flex;align-items:center;gap:12px">
                <span style="font-size:1.3rem;width:28px;flex-shrink:0">${c.icon}</span>
                <label style="flex:1;font-size:.88rem;font-weight:700;color:var(--text)">${c.name}</label>
                <input type="number" class="form-control" id="budget-${c.id}"
                  value="${budgets[c.id] || ''}" placeholder="0"
                  style="width:150px;text-align:right" min="0" step="10000">
              </div>`).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('budget-modal')">Cancelar</button>
            <button class="btn btn-primary" onclick="BudgetPage.saveBudgets()">💾 Guardar</button>
          </div>
        </div>
      </div>`;
  },

  openEdit() {
    openModal('budget-modal');
  },

  saveBudgets() {
    const cats = DB.get('categories').filter(c => c.id !== 'ingreso');
    cats.forEach(c => {
      const input = document.getElementById(`budget-${c.id}`);
      const val = parseFloat(input?.value) || 0;
      DB.setBudget(c.id, val);
    });
    closeModal('budget-modal');
    showToast('Presupuestos guardados 💜', 'success');
    this.render();
  }
};
