/* ============================================================
   FINANZA PERSONAL — js/analysis.js
   Análisis Inteligente: Alertas, Insights, Tips Personalizados
   ============================================================ */

'use strict';

window.AnalysisPage = {

  init() {
    const { selectedYear: year, selectedMonth: month } = AppState;
    this.render(year, month);
  },

  render(year, month) {
    const el = document.getElementById('analysis-page');
    if (!el) return;

    this.renderAlerts(year, month);
    this.renderInsights(year, month);
    this.renderCategoryDetails(year, month);
  },

  renderAlerts(year, month) {
    const container = document.getElementById('analysis-alerts-container');
    if (!container) return;

    const allMovements = DB.get('movements');
    const hasData = allMovements.length > 0;

    if (!hasData) {
      container.innerHTML = `
        <div class="alert alert-info">
          <span class="alert-icon">👋</span>
          <div class="alert-body">
            <strong>¡Bienvenida Diana!</strong>
            <p>Empieza registrando un movimiento para ver análisis inteligentes.</p>
          </div>
        </div>`;
      return;
    }

    const alerts = generateAlerts(year, month);
    if (!alerts.length) {
      container.innerHTML = `
        <div class="alert alert-success">
          <span class="alert-icon">🎊</span>
          <div class="alert-body">
            <strong>Todo bajo control</strong>
            <p>No hay alertas críticas para este mes. Sigue con tu buen hábito financiero.</p>
          </div>
        </div>`;
      return;
    }

    const typeMap = { 
      success: 'alert-success', 
      warning: 'alert-warning', 
      danger: 'alert-danger', 
      info: 'alert-info' 
    };

    container.innerHTML = alerts.map(a => `
      <div class="alert ${typeMap[a.type] || 'alert-info'}">
        <span class="alert-icon">${a.icon}</span>
        <div class="alert-body">
          <strong>${a.title}</strong>
          <p>${a.msg}</p>
        </div>
      </div>`).join('');
  },

  renderInsights(year, month) {
    const list = document.getElementById('analysis-insights-list');
    const tipContainer = document.getElementById('analysis-tip-container');
    if (!list || !tipContainer) return;

    const insights = generateInsights(year, month);
    const tip = getFriendlyTip();

    if (insights.length === 0) {
      list.innerHTML = `<div class="insight-item text-muted">No hay suficientes datos este mes para mostrar insights.</div>`;
    } else {
      list.innerHTML = insights.map(i => `
        <div class="insight-item">
          ✨ ${i}
        </div>`).join('');
    }

    tipContainer.innerHTML = `
      <div class="tip-card">
        <div class="tip-card-icon">💡</div>
        <div class="tip-card-body">
          <strong>Consejo para Diana:</strong>
          <p>${tip}</p>
        </div>
      </div>`;
  },

  renderCategoryDetails(year, month) {
    const container = document.getElementById('analysis-category-details');
    if (!container) return;

    const movs = DB.getMovements({ year, month }).filter(m => m.type === 'expense');
    if (movs.length === 0) {
      container.innerHTML = `<div class="empty-state">No hay gastos registrados en este mes.</div>`;
      return;
    }

    const totalExpense = movs.reduce((s, m) => s + m.amount, 0);
    const catTotals = calcCategoryTotals(movs);
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Monto Gastado</th>
            <th>% del Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(([id, amount]) => {
            const cat = getCategoryById(id);
            const pct = Math.round(amount / totalExpense * 100);
            const budget = DB.get('budgets')[id] || 0;
            let status = '—';
            let statusClass = '';
            
            if (budget > 0) {
              const used = amount / budget;
              if (used > 1) {
                status = 'Excedido';
                statusClass = 'text-danger';
              } else if (used > 0.8) {
                status = 'Cerca del límite';
                statusClass = 'text-warning';
              } else {
                status = 'Buen manejo';
                statusClass = 'text-success';
              }
            }

            return `
              <tr>
                <td class="font-bold">
                  <span style="margin-right:8px">${cat?.icon}</span>${cat?.name}
                </td>
                <td class="font-bold">${formatCurrency(amount)}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="progress-bar-bg" style="width:60px;height:6px;margin-bottom:0">
                      <div class="progress-bar-fill" style="width:${pct}%"></div>
                    </div>
                    <span class="text-xs font-bold">${pct}%</span>
                  </div>
                </td>
                <td class="${statusClass} font-bold text-xs">${status}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;

    container.innerHTML = html;
  }
};
