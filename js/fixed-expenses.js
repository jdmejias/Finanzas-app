/* ============================================================
   FINANZA PERSONAL — js/fixed-expenses.js
   Gestión de gastos mensuales recurrentes
   ============================================================ */

'use strict';

window.FixedPage = {
  editingId: null,

  init() {
    this.render();
    this.populateCategories();
  },

  render() {
    const listContainer = document.getElementById('fixed-list-container');
    if (!listContainer) return;

    const fixeds = DB.get('fixedExpenses') || [];

    if (fixeds.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <h3>Sin gastos fijos</h3>
          <p>Configura tus gastos recurrentes aquí.</p>
          <button class="btn btn-primary mt-4" onclick="FixedPage.openAdd()">➕ Crear mi primer gasto fijo</button>
        </div>`;
      return;
    }

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre y Categoría</th>
            <th>Monto</th>
            <th>Día sugerido</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${fixeds.map(fe => {
            const cat = getCategoryById(fe.category);
            return `
              <tr>
                <td>
                  <div class="flex items-center gap-3">
                    <div style="font-size:1.5rem">${cat?.icon || '📦'}</div>
                    <div>
                      <div class="font-bold">${fe.name}</div>
                      <div class="text-xs text-muted">${cat?.name || 'Otro'}</div>
                    </div>
                  </div>
                </td>
                <td class="font-bold text-danger">${formatCurrency(fe.amount)}</td>
                <td>
                  <span class="badge badge-info">${fe.day ? 'Día ' + fe.day : 'Por defecto'}</span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-ghost btn-icon" onclick="FixedPage.openEdit(${fe.id})" title="Editar">✏️</button>
                    <button class="btn btn-ghost btn-icon" onclick="FixedPage.delete(${fe.id})" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;

    listContainer.innerHTML = html;
  },

  populateCategories() {
    const sel = document.getElementById('fixed-category');
    if (!sel) return;
    const cats = CATEGORIES.filter(c => c.id !== 'ingreso');
    sel.innerHTML = cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  },

  openAdd() {
    this.editingId = null;
    document.getElementById('fixed-modal-title').textContent = '📋 Nuevo Gasto Fijo';
    document.getElementById('fixed-name').value = '';
    document.getElementById('fixed-amount').value = '';
    document.getElementById('fixed-day').value = '';
    document.getElementById('fixed-category').selectedIndex = 0;
    openModal('fixed-modal');
  },

  openEdit(id) {
    const fe = DB.get('fixedExpenses').find(f => f.id === id);
    if (!fe) return;
    this.editingId = id;
    document.getElementById('fixed-modal-title').textContent = '✏️ Editar Gasto Fijo';
    document.getElementById('fixed-name').value = fe.name;
    document.getElementById('fixed-amount').value = fe.amount;
    document.getElementById('fixed-day').value = fe.day || '';
    document.getElementById('fixed-category').value = fe.category;
    openModal('fixed-modal');
  },

  save() {
    const name = document.getElementById('fixed-name')?.value?.trim();
    const amount = parseFloat(document.getElementById('fixed-amount')?.value);
    const day = parseInt(document.getElementById('fixed-day')?.value);
    const category = document.getElementById('fixed-category')?.value;

    if (!name || isNaN(amount) || amount <= 0) {
      showToast('Por favor completa los campos obligatorios', 'error');
      return;
    }

    const data = {
      name,
      amount,
      category,
      day: isNaN(day) ? null : day
    };

    if (this.editingId) {
      DB.updateFixedExpense(this.editingId, data);
      showToast('Gasto fijo actualizado 💜', 'success');
    } else {
      DB.addFixedExpense(data);
      showToast('¡Gasto fijo creado! 🚀', 'success');
    }

    closeModal('fixed-modal');
    this.render();
  },

  delete(id) {
    if (!confirm('¿Quieres eliminar este gasto recurrente?')) return;
    DB.deleteFixedExpense(id);
    showToast('Gasto fijo eliminado', 'warning');
    this.render();
  },

  process() {
    const { selectedYear: year, selectedMonth: month } = AppState;
    const res = DB.processFixedExpenses(year, month);

    if (res.added > 0) {
      showToast(`¡Listo! Se agregaron ${res.added} movimientos este mes ✨`, 'success');
    } else if (res.skipped > 0) {
      showToast('Todos tus gastos fijos ya están registrados en este mes.', 'info');
    } else {
      showToast('No tienes gastos fijos configurados.', 'warning');
    }

    // Refresh if we are in the current month in the dashboard or movements
    // But since this is a general process, we just show the result.
    // If the user navigates to Movements they will see them.
  }
};
