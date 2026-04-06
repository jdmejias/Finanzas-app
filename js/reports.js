/* ============================================================
   FINANZA PERSONAL — js/reports.js
   Reportes mensuales + por categoría + exportación
   ============================================================ */

'use strict';

window.ReportsPage = {

  charts: {},
  activeTab: 'monthly',

  init() {
    this.render();
  },

  render() {
    const el = document.getElementById('reports-page');
    if (!el) return;

    const { selectedYear: year, selectedMonth: month } = AppState;

    el.innerHTML = `
      <div class="page-wrapper" id="report-content">
        <div class="page-header">
          <div class="page-header-info">
            <h1>📄 Reportes</h1>
            <p>Análisis de tus finanzas — ${getMonthName(month)} ${year}</p>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-secondary" onclick="ReportsPage.exportCSV()">📊 Exportar CSV</button>
            <button class="btn btn-primary" onclick="window.print()">🖨️ Exportar PDF</button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn ${this.activeTab==='monthly'?'active':''}" onclick="ReportsPage.switchTab('monthly')">📅 Mensual</button>
          <button class="tab-btn ${this.activeTab==='category'?'active':''}" onclick="ReportsPage.switchTab('category')">📂 Por categoría</button>
          <button class="tab-btn ${this.activeTab==='fixedvariable'?'active':''}" onclick="ReportsPage.switchTab('fixedvariable')">📋 Fijo vs Variable</button>
          <button class="tab-btn ${this.activeTab==='savings'?'active':''}" onclick="ReportsPage.switchTab('savings')">💰 Ahorro</button>
        </div>

        <div id="report-tab-content">
          ${this.renderActiveTab(year, month)}
        </div>
      </div>`;

    setTimeout(() => this.renderCharts(year, month), 80);
  },

  switchTab(tab) {
    this.activeTab = tab;
    const { selectedYear: year, selectedMonth: month } = AppState;
    const content = document.getElementById('report-tab-content');
    if (content) {
      content.innerHTML = this.renderActiveTab(year, month);
      // Destroy old charts
      Object.values(this.charts).forEach(c => c?.destroy?.());
      this.charts = {};
      setTimeout(() => this.renderCharts(year, month), 80);
    }
    document.querySelectorAll('.tab-btn').forEach((b, i) => {
      const tabs = ['monthly','category','fixedvariable','savings'];
      b.classList.toggle('active', tabs[i] === tab);
    });
  },

  renderActiveTab(year, month) {
    switch (this.activeTab) {
      case 'monthly':       return this.renderMonthly(year, month);
      case 'category':      return this.renderByCategory(year, month);
      case 'fixedvariable': return this.renderFixedVariable(year, month);
      case 'savings':       return this.renderSavingsReport();
      default:              return this.renderMonthly(year, month);
    }
  },

  // ── Monthly Report ──────────────────────────────────────────
  renderMonthly(year, month) {
    const months = [];
    const now = new Date();
    const rows = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const t = calcMonthTotals(d.getFullYear(), d.getMonth());
      months.push(getMonthName(d.getMonth()));
      rows.push({ month: getMonthName(d.getMonth()), year: d.getFullYear(), ...t });
    }

    const curr = calcMonthTotals(year, month);

    return `
      <div class="chart-card mb-6">
        <div class="chart-card-header">
          <div>
            <div class="chart-card-title">📅 Ingresos vs Gastos (6 meses)</div>
            <div class="chart-card-subtitle">Comparativa mensual</div>
          </div>
        </div>
        <div class="chart-container chart-container-lg">
          <canvas id="rpt-monthly-bar"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">📊 Resumen por mes</div></div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead><tr>
              <th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Ahorro</th><th>Balance</th>
            </tr></thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td><strong>${r.month} ${r.year}</strong></td>
                  <td style="color:#059669;font-weight:700">${formatCurrency(r.income)}</td>
                  <td style="color:#BE185D;font-weight:700">${formatCurrency(r.expense)}</td>
                  <td style="color:var(--primary-dark);font-weight:700">${formatCurrency(Math.max(0,r.income-r.expense))}</td>
                  <td style="color:${r.balance>=0?'#059669':'#DC2626'};font-weight:700">${formatCurrency(r.balance)}</td>
                </tr>`).join('')}
            </tbody>
            <tfoot>
              <tr style="background:var(--bg-secondary)">
                <td><strong>${getMonthName(month)} ${year} (actual)</strong></td>
                <td style="color:#059669;font-weight:800">${formatCurrency(curr.income)}</td>
                <td style="color:#BE185D;font-weight:800">${formatCurrency(curr.expense)}</td>
                <td style="color:var(--primary-dark);font-weight:800">${formatCurrency(Math.max(0,curr.income-curr.expense))}</td>
                <td style="color:${curr.balance>=0?'#059669':'#DC2626'};font-weight:800">${formatCurrency(curr.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>`;
  },

  // ── Category Report ─────────────────────────────────────────
  renderByCategory(year, month) {
    const movs = DB.getMovements({ year, month, type: 'expense' });
    const catTotals = calcCategoryTotals(movs);
    const total = Object.values(catTotals).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    return `
      <div class="charts-grid mb-6">
        <div class="chart-card">
          <div class="chart-card-header">
            <div class="chart-card-title">🍰 Distribución de gastos</div>
          </div>
          <div class="chart-container chart-container-md">
            <canvas id="rpt-cat-pie"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <div class="chart-card-title">📊 Gastos por categoría</div>
          </div>
          <div class="chart-container chart-container-md">
            <canvas id="rpt-cat-bar"></canvas>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">📂 Detalle por categoría</div></div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead><tr><th>#</th><th>Categoría</th><th>Total gastado</th><th>% del total</th><th>Presupuesto</th><th>Estado</th></tr></thead>
            <tbody>
              ${sorted.map(([id, amt], i) => {
                const cat = getCategoryById(id);
                const pct = total > 0 ? Math.round(amt / total * 100) : 0;
                const budget = DB.get('budgets')[id] || 0;
                const status = budget === 0 ? '—' : amt > budget ? '🚨 Excedido' : amt / budget > 0.85 ? '⚠️ Cerca' : '✅ Bien';
                return `<tr>
                  <td class="text-muted">${i+1}</td>
                  <td><span style="font-size:1.1rem">${cat?.icon}</span> <strong>${cat?.name}</strong></td>
                  <td style="font-weight:700;color:#BE185D">${formatCurrency(amt)}</td>
                  <td>${pct}%</td>
                  <td>${budget > 0 ? formatCurrency(budget) : '—'}</td>
                  <td>${status}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  // ── Fixed vs Variable ───────────────────────────────────────
  renderFixedVariable(year, month) {
    const movs = DB.getMovements({ year, month, type: 'expense' });
    const fixed    = movs.filter(m => m.isFixed);
    const variable = movs.filter(m => !m.isFixed);
    const fixedAmt = fixed.reduce((a, m) => a + m.amount, 0);
    const varAmt   = variable.reduce((a, m) => a + m.amount, 0);
    const total    = fixedAmt + varAmt;
    const fixedPct = total > 0 ? Math.round(fixedAmt / total * 100) : 0;
    const varPct   = 100 - fixedPct;

    return `
      <div class="grid grid-2 mb-6">
        <div class="kpi-card expense">
          <div class="kpi-card-header">
            <div class="kpi-icon">📋</div>
          </div>
          <div class="kpi-label">Gastos Fijos</div>
          <div class="kpi-value">${formatCurrency(fixedAmt)}</div>
          <div class="kpi-sub">${fixedPct}% del total de gastos (${fixed.length} movimientos)</div>
        </div>
        <div class="kpi-card savings">
          <div class="kpi-card-header">
            <div class="kpi-icon">🔄</div>
          </div>
          <div class="kpi-label">Gastos Variables</div>
          <div class="kpi-value">${formatCurrency(varAmt)}</div>
          <div class="kpi-sub">${varPct}% del total de gastos (${variable.length} movimientos)</div>
        </div>
      </div>

      <div class="chart-card mb-6">
        <div class="chart-card-header">
          <div class="chart-card-title">📊 Fijo vs Variable</div>
        </div>
        <div class="chart-container chart-container-md">
          <canvas id="rpt-fixed-pie"></canvas>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">📋 Gastos Fijos</div></div>
          ${fixed.map(m => {
            const cat = getCategoryById(m.category);
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-light)">
              <div style="display:flex;align-items:center;gap:8px">${cat?.icon} <span style="font-weight:600;font-size:.88rem">${m.description}</span></div>
              <span style="font-weight:700;color:#BE185D">${formatCurrency(m.amount)}</span>
            </div>`;
          }).join('') || '<p class="text-muted text-sm">Sin gastos fijos</p>'}
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">🔄 Gastos Variables</div></div>
          ${variable.slice(0,10).map(m => {
            const cat = getCategoryById(m.category);
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-light)">
              <div style="display:flex;align-items:center;gap:8px">${cat?.icon} <span style="font-weight:600;font-size:.88rem">${m.description}</span></div>
              <span style="font-weight:700;color:#BE185D">${formatCurrency(m.amount)}</span>
            </div>`;
          }).join('') || '<p class="text-muted text-sm">Sin gastos variables</p>'}
        </div>
      </div>`;
  },

  // ── Savings Report ──────────────────────────────────────────
  renderSavingsReport() {
    const goals = DB.get('goals');
    const now = new Date();
    const monthlySavings = [];
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(getMonthName(d.getMonth()).substring(0,3));
      const t = calcMonthTotals(d.getFullYear(), d.getMonth());
      monthlySavings.push(Math.max(0, t.income - t.expense));
    }

    return `
      <div class="chart-card mb-6">
        <div class="chart-card-header">
          <div class="chart-card-title">📈 Evolución del ahorro</div>
        </div>
        <div class="chart-container chart-container-lg">
          <canvas id="rpt-savings-line"></canvas>
        </div>
      </div>

      <div class="card mb-6">
        <div class="card-header"><div class="card-title">🎯 Estado de metas</div></div>
        ${goals.length ? `
        <table class="data-table">
          <thead><tr><th>Meta</th><th>Ahorrado</th><th>Meta total</th><th>Progreso</th><th>Fecha límite</th></tr></thead>
          <tbody>
            ${goals.map(g => {
              const pct = g.target > 0 ? Math.min(100, Math.round(g.saved/g.target*100)) : 0;
              return `<tr>
                <td>${g.icon} <strong>${g.name}</strong></td>
                <td style="font-weight:700;color:var(--primary-dark)">${formatCurrency(g.saved)}</td>
                <td>${formatCurrency(g.target)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="flex:1;height:8px;background:var(--border-light);border-radius:99px;overflow:hidden">
                      <div style="height:100%;width:${pct}%;background:${g.color};border-radius:99px"></div>
                    </div>
                    <span style="font-weight:700;font-size:.8rem">${pct}%</span>
                  </div>
                </td>
                <td class="text-muted text-sm">${g.deadline ? formatDate(g.deadline) : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>` : '<p class="text-muted">Sin metas de ahorro registradas.</p>'}
      </div>`;
  },

  // ── Charts ──────────────────────────────────────────────────
  renderCharts(year, month) {
    const isDark = DB.getSetting('theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#9D8EBB' : '#7C6F8E';
    const now = new Date();

    if (this.activeTab === 'monthly') {
      const cvs = document.getElementById('rpt-monthly-bar');
      if (cvs) {
        const months=[], inc=[], exp=[];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
          months.push(getMonthName(d.getMonth()).substring(0,3));
          const t = calcMonthTotals(d.getFullYear(), d.getMonth());
          inc.push(t.income); exp.push(t.expense);
        }
        this.charts.monthly = new Chart(cvs.getContext('2d'), {
          type: 'bar',
          data: { labels: months, datasets: [
            { label: 'Ingresos', data: inc,  backgroundColor: 'rgba(110,231,183,0.8)', borderRadius: 8, borderSkipped: false },
            { label: 'Gastos',   data: exp,  backgroundColor: 'rgba(249,168,212,0.8)', borderRadius: 8, borderSkipped: false }
          ]},
          options: { responsive:true, maintainAspectRatio:false,
            plugins: { legend: { labels: { color: textColor, font:{family:'Nunito',weight:'700',size:11} } }, tooltip: { callbacks: { label: ctx => ` ${formatCurrency(ctx.raw)}` } } },
            scales: {
              x: { grid:{display:false}, ticks:{color:textColor,font:{family:'Nunito',weight:'600'}} },
              y: { grid:{color:gridColor}, ticks:{color:textColor,font:{family:'Nunito',weight:'600'}, callback: v => formatCurrency(v,true)} }
            }
          }
        });
      }
    }

    if (this.activeTab === 'category') {
      const movs = DB.getMovements({ year, month, type:'expense' });
      const catTotals = calcCategoryTotals(movs);
      const sorted = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).slice(0,8);
      const labels = sorted.map(([id]) => getCategoryById(id)?.name || id);
      const data   = sorted.map(([,v]) => v);
      const colors = sorted.map(([id]) => getCategoryById(id)?.color || '#D1D5DB');

      const pieCvs = document.getElementById('rpt-cat-pie');
      if (pieCvs) {
        this.charts.catPie = new Chart(pieCvs.getContext('2d'), {
          type: 'doughnut',
          data: { labels, datasets:[{ data, backgroundColor: colors, borderWidth:3, borderColor: isDark?'#1A1230':'#fff' }] },
          options: { responsive:true, maintainAspectRatio:false, cutout:'65%',
            plugins: { legend:{display:false}, tooltip:{ callbacks:{ label: ctx => ` ${formatCurrency(ctx.raw)}` } } }
          }
        });
      }
      const barCvs = document.getElementById('rpt-cat-bar');
      if (barCvs) {
        this.charts.catBar = new Chart(barCvs.getContext('2d'), {
          type: 'bar',
          data: { labels, datasets:[{ label:'Gasto', data, backgroundColor: colors, borderRadius:8, borderSkipped:false }] },
          options: { responsive:true, maintainAspectRatio:false, indexAxis:'y',
            plugins:{ legend:{display:false}, tooltip:{ callbacks:{label: ctx=>` ${formatCurrency(ctx.raw)}`} } },
            scales: {
              x: {grid:{color:gridColor}, ticks:{color:textColor, callback: v=>formatCurrency(v,true)}},
              y: {grid:{display:false}, ticks:{color:textColor,font:{family:'Nunito',weight:'700'}}}
            }
          }
        });
      }
    }

    if (this.activeTab === 'fixedvariable') {
      const movs = DB.getMovements({ year, month, type:'expense' });
      const fixedAmt = movs.filter(m=>m.isFixed).reduce((a,m)=>a+m.amount,0);
      const varAmt   = movs.filter(m=>!m.isFixed).reduce((a,m)=>a+m.amount,0);
      const cvs = document.getElementById('rpt-fixed-pie');
      if (cvs) {
        this.charts.fixedPie = new Chart(cvs.getContext('2d'), {
          type: 'doughnut',
          data: { labels:['Fijos','Variables'], datasets:[{ data:[fixedAmt, varAmt], backgroundColor:['#A5B4FC','#F9A8D4'], borderWidth:3, borderColor: isDark?'#1A1230':'#fff' }] },
          options: { responsive:true, maintainAspectRatio:false, cutout:'65%',
            plugins: { legend:{ labels:{color:textColor,font:{family:'Nunito',weight:'700'}} }, tooltip:{callbacks:{label:ctx=>` ${formatCurrency(ctx.raw)}`}} }
          }
        });
      }
    }

    if (this.activeTab === 'savings') {
      const cvs = document.getElementById('rpt-savings-line');
      if (cvs) {
        const labels=[]; const data=[];
        for (let i=5; i>=0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
          labels.push(getMonthName(d.getMonth()).substring(0,3));
          const t = calcMonthTotals(d.getFullYear(), d.getMonth());
          data.push(Math.max(0, t.income - t.expense));
        }
        this.charts.savLine = new Chart(cvs.getContext('2d'), {
          type: 'line',
          data: { labels, datasets:[{ label:'Ahorro', data, borderColor:'#C084FC', backgroundColor:'rgba(192,132,252,0.15)', tension:0.45, fill:true, pointBackgroundColor:'#C084FC', pointBorderColor:'#fff', pointBorderWidth:3, pointRadius:6, pointHoverRadius:9 }] },
          options: { responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>` ${formatCurrency(ctx.raw)}`}} },
            scales: {
              x:{ grid:{display:false}, ticks:{color:textColor,font:{family:'Nunito',weight:'600'}} },
              y:{ grid:{color:gridColor}, ticks:{color:textColor, callback:v=>formatCurrency(v,true)} }
            }
          }
        });
      }
    }
  },

  // ── Export CSV ──────────────────────────────────────────────
  exportCSV() {
    const { selectedYear: year, selectedMonth: month } = AppState;
    const movs = DB.getMovements({ year, month });
    const header = ['Fecha','Tipo','Categoría','Descripción','Monto','Método de pago','Fijo'];
    const rows = movs.map(m => {
      const cat = getCategoryById(m.category);
      return [m.date, m.type==='income'?'Ingreso':'Gasto', cat?.name||m.category, m.description, m.amount, m.paymentMethod, m.isFixed?'Sí':'No'];
    });
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href:url, download:`finanza_${getMonthName(month)}_${year}.csv` });
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado 📊', 'success');
  }
};
