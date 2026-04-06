/* ============================================================
   FINANZA PERSONAL — js/dashboard.js
   Dashboard: KPI cards, alertas, gráficos Chart.js, insights
   ============================================================ */

'use strict';

window.DashboardPage = {

  charts: {},

  init() {
    const { selectedYear: year, selectedMonth: month } = AppState;
    const allMovements = DB.getMovements({ year, month });
    const hasData = DB.get('movements').length > 0;

    this.renderKPIs(year, month);
    this.renderCategoryPie(year, month);
    this.renderMonthlyBar();
    this.renderSavingsLine();
    this.renderRecentMovements(year, month, !hasData);
  },

  // ── KPI Cards ──────────────────────────────────────────────
  renderKPIs(year, month) {
    const curr = calcMonthTotals(year, month);
    const prevDate = new Date(year, month - 1, 1);
    const prev = calcMonthTotals(prevDate.getFullYear(), prevDate.getMonth());

    const kpiData = [
      { id: 'kpi-income',  type: 'income',  label: 'Ingresos del mes', icon: '💵', value: curr.income,
        trend: prev.income > 0 ? (curr.income - prev.income) / prev.income * 100 : 0,
        sub: `vs ${formatCurrency(prev.income)} el mes pasado` },
      { id: 'kpi-expense', type: 'expense', label: 'Gastos del mes',   icon: '💳', value: curr.expense,
        trend: prev.expense > 0 ? -(curr.expense - prev.expense) / prev.expense * 100 : 0,
        sub: `vs ${formatCurrency(prev.expense)} el mes pasado` },
      { id: 'kpi-savings', type: 'savings', label: 'Ahorro del mes',   icon: '💰', value: Math.max(0, curr.income - curr.expense),
        trend: prev.income > 0 ? ((curr.income - curr.expense) - (prev.income - prev.expense)) : 0,
        sub: `Meta: ${formatCurrency(DB.get('settings').monthlyBudget * 0.15)}` },
      { id: 'kpi-balance', type: 'balance', label: 'Balance disponible',icon: '✨', value: curr.balance,
        trend: curr.balance >= 0 ? 1 : -1,
        sub: curr.balance >= 0 ? '¡Va muy bien! 🎉' : 'Cuidado con los gastos ⚠️' }
    ];

    const container = document.getElementById('kpi-grid');
    if (!container) return;

    container.innerHTML = kpiData.map(k => {
      const trendPct = typeof k.trend === 'number' ? k.trend : 0;
      const up = trendPct >= 0;
      const trendClass  = k.type === 'expense' ? (up ? 'down' : 'up') : (up ? 'up' : 'down');
      const trendSymbol = trendPct >= 0 ? '↑' : '↓';

      return `
        <div class="kpi-card ${k.type}" id="${k.id}">
          <div class="kpi-card-header">
            <div class="kpi-icon">${k.icon}</div>
            <div class="kpi-trend ${trendClass}">
              ${trendSymbol} ${Math.abs(trendPct).toFixed(0)}%
            </div>
          </div>
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value">${formatCurrency(k.value)}</div>
          <div class="kpi-sub">${k.sub}</div>
        </div>`;
    }).join('');
  },

  // ── Pie: Gastos por Categoría ───────────────────────────────
  renderCategoryPie(year, month) {
    const canvas = document.getElementById('chart-category-pie');
    if (!canvas) return;

    const movs = DB.getMovements({ year, month });
    const catTotals = calcCategoryTotals(movs);
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (!sorted.length) {
      canvas.parentElement.innerHTML = '<div class="chart-no-data"><span>🍰</span><p>Sin datos este mes</p></div>';
      return;
    }

    const labels = sorted.map(([id]) => getCategoryById(id)?.name || id);
    const data   = sorted.map(([, v]) => v);
    const colors = sorted.map(([id]) => getCategoryById(id)?.color || '#D1D5DB');

    if (this.charts.pie) this.charts.pie.destroy();

    this.charts.pie = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 3, borderColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#fff' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = Math.round(ctx.raw / total * 100);
                return ` ${formatCurrency(ctx.raw)} (${pct}%)`;
              }
            }
          }
        }
      }
    });

    // Render custom legend
    const legend = document.getElementById('pie-legend');
    if (legend) {
      legend.innerHTML = sorted.map(([id, val]) => {
        const cat = getCategoryById(id);
        const total = data.reduce((a, b) => a + b, 0);
        const pct = Math.round(val / total * 100);
        return `<div class="pie-legend-item"><div class="pie-legend-dot" style="background:${cat?.color}"></div>${cat?.icon} ${cat?.name} <span class="text-muted text-xs">${pct}%</span></div>`;
      }).join('');
    }
  },

  // ── Bar: Ingresos vs Gastos por Mes ────────────────────────
  renderMonthlyBar() {
    const canvas = document.getElementById('chart-monthly-bar');
    if (!canvas) return;

    const months = [];
    const incomes = [], expenses = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(getMonthName(d.getMonth()).substring(0, 3));
      const t = calcMonthTotals(d.getFullYear(), d.getMonth());
      incomes.push(t.income);
      expenses.push(t.expense);
    }

    if (this.charts.bar) this.charts.bar.destroy();

    const isDark = DB.getSetting('theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#9D8EBB' : '#7C6F8E';

    this.charts.bar = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Ingresos', data: incomes,  backgroundColor: 'rgba(110,231,183,0.8)', borderRadius: 8, borderSkipped: false },
          { label: 'Gastos',   data: expenses, backgroundColor: 'rgba(249,168,212,0.8)', borderRadius: 8, borderSkipped: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor, font: { family: 'Nunito', weight: '700', size: 11 }, boxWidth: 12, borderRadius: 6 } },
          tooltip: { callbacks: { label: ctx => ` ${formatCurrency(ctx.raw)}` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Nunito', weight: '600' } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Nunito', weight: '600' }, callback: v => formatCurrency(v, true) } }
        }
      }
    });
  },

  // ── Line: Evolución del Ahorro ──────────────────────────────
  renderSavingsLine() {
    const canvas = document.getElementById('chart-savings-line');
    if (!canvas) return;

    const labels = [], savingsData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(getMonthName(d.getMonth()).substring(0, 3));
      const t = calcMonthTotals(d.getFullYear(), d.getMonth());
      savingsData.push(Math.max(0, t.income - t.expense));
    }

    if (this.charts.line) this.charts.line.destroy();

    const isDark = DB.getSetting('theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#9D8EBB' : '#7C6F8E';

    this.charts.line = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Ahorro',
          data: savingsData,
          borderColor: '#C084FC',
          backgroundColor: 'rgba(192,132,252,0.12)',
          tension: 0.45,
          fill: true,
          pointBackgroundColor: '#C084FC',
          pointBorderColor: '#fff',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 9
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${formatCurrency(ctx.raw)}` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Nunito', weight: '600' } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Nunito', weight: '600' }, callback: v => formatCurrency(v, true) } }
        }
      }
    });
  },

  // ── Recent Movements ───────────────────────────────────────
  renderRecentMovements(year, month, isEmpty = false) {
    const container = document.getElementById('recent-movements');
    if (!container) return;

    if (isEmpty) {
      container.innerHTML = `
        <div class="empty-state" style="padding:24px">
          <span class="empty-icon">📝</span>
          <h3>Sin movimientos aún</h3>
          <p>Usa los botones de arriba para agregar tu primer ingreso o gasto.</p>
          <button class="btn btn-primary mt-4" onclick="MovementsPage.openAdd?.('expense') || navigateTo('movements')">
            ➕ Agregar primer gasto
          </button>
        </div>`;
      return;
    }

    const movs = DB.getMovements({ year, month }).slice(0, 6);
    if (!movs.length) {
      container.innerHTML = '<div class="empty-state" style="padding:30px"><span class="empty-icon">💸</span><p>Sin movimientos este mes</p></div>';
      return;
    }

    container.innerHTML = movs.map(m => {
      const cat = getCategoryById(m.category);
      const sign = m.type === 'income' ? '+' : '-';
      return `
        <div class="movement-item" onclick="navigateTo('movements')">
          <div class="movement-icon-wrap" style="background:${cat?.bg || '#f5f5f5'}">
            ${cat?.icon || '💸'}
          </div>
          <div class="movement-info">
            <div class="movement-desc">${m.description}</div>
            <div class="movement-meta">
              <span class="cat-badge" style="background:${cat?.bg};color:${cat?.color}">${cat?.name}</span>
              <span>${formatDateShort(m.date)}</span>
              <span>${m.paymentMethod}</span>
            </div>
          </div>
          <div class="movement-amount ${m.type}">${sign}${formatCurrency(m.amount)}</div>
        </div>`;
    }).join('');
  }
};
