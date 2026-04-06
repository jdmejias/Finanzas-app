/* ============================================================
   FINANZA PERSONAL — js/data.js
   Base de datos en localStorage + CRUD — app limpia
   ============================================================ */

'use strict';

// ── SCHEMA ──────────────────────────────────────────────────

const DB_KEY = 'finanza_personal_v3';

const DEFAULT_SETTINGS = {
  currency: 'COP',
  currencySymbol: '$',
  currencyLocale: 'es-CO',
  userName: 'Diana',
  theme: 'light',
  monthlyBudget: 5600000
};

const CATEGORIES = [
  { id: 'comida',         name: 'Comida',          icon: '🍽️',  color: '#FDBA74', bg: '#FFF7ED' },
  { id: 'arriendo',       name: 'Arriendo',         icon: '🏠',  color: '#93C5FD', bg: '#EFF6FF' },
  { id: 'internet',       name: 'Internet',         icon: '📶',  color: '#A5B4FC', bg: '#EEF2FF' },
  { id: 'servicios',      name: 'Servicios',        icon: '💡',  color: '#FCD34D', bg: '#FFFBEB' },
  { id: 'transporte',     name: 'Transporte',       icon: '🚌',  color: '#6EE7B7', bg: '#ECFDF5' },
  { id: 'salud',          name: 'Salud',            icon: '💊',  color: '#FCA5A5', bg: '#FEF2F2' },
  { id: 'educacion',      name: 'Educación',        icon: '📚',  color: '#C4B5FD', bg: '#F5F3FF' },
  { id: 'hogar',          name: 'Hogar',            icon: '🛒',  color: '#86EFAC', bg: '#F0FDF4' },
  { id: 'ropa',           name: 'Ropa',             icon: '👗',  color: '#F9A8D4', bg: '#FDF2F8' },
  { id: 'entretenimiento',name: 'Entretenimiento',  icon: '🎬',  color: '#FDBA74', bg: '#FFF7ED' },
  { id: 'gastos_fijos',   name: 'Gastos Fijos',     icon: '📋',  color: '#94A3B8', bg: '#F8FAFC' },
  { id: 'gastos_variables',name:'Gastos Variables', icon: '🔄',  color: '#CBD5E1', bg: '#F8FAFC' },
  { id: 'ahorro',         name: 'Ahorro',           icon: '💰',  color: '#C084FC', bg: '#F5F3FF' },
  { id: 'deudas',         name: 'Deudas',           icon: '📌',  color: '#F87171', bg: '#FEF2F2' },
  { id: 'otros',          name: 'Otros',            icon: '✨',  color: '#D1D5DB', bg: '#F9FAFB' },
  { id: 'ingreso',        name: 'Ingreso',          icon: '💵',  color: '#6EE7B7', bg: '#ECFDF5' }
];

const PAYMENT_METHODS = [
  'Efectivo', 'Tarjeta débito', 'Tarjeta crédito',
  'Transferencia', 'Nequi', 'Daviplata', 'Otro'
];

// ── VALORES INICIALES SUGERIDOS (presupuestos de referencia) ─
// Puedes ajustarlos en Configuración > Presupuesto

const DEFAULT_BUDGETS = {
  comida:           800000,
  arriendo:         900000,
  internet:         180000,
  servicios:        450000,
  transporte:       200000,
  salud:            150000,
  educacion:        100000,
  hogar:            100000,
  ropa:             150000,
  entretenimiento:   80000,
  gastos_fijos:          0,
  gastos_variables:      0,
  ahorro:           500000,
  deudas:                0,
  otros:            500000
};

// ── DATOS INICIALES DE DIANA ─ Abril 2026 ───────────────────
// Estos son los datos reales que se cargan al primer inicio

const INITIAL_MOVEMENTS = [
  // ── INGRESOS ──
  {
    id: 1, type: 'income', category: 'ingreso',
    description: 'Salario mensual',
    amount: 5600000, date: '2026-04-01',
    paymentMethod: 'Transferencia', isFixed: true,
    createdAt: '2026-04-01T08:00:00.000Z'
  },

  // ── GASTOS FIJOS ──
  {
    id: 2, type: 'expense', category: 'arriendo',
    description: 'Arriendo apartamento',
    amount: 900000, date: '2026-04-02',
    paymentMethod: 'Transferencia', isFixed: true,
    createdAt: '2026-04-02T08:00:00.000Z'
  },
  {
    id: 3, type: 'expense', category: 'servicios',
    description: 'Servicios (agua, luz, aseo)',
    amount: 370000, date: '2026-04-05',
    paymentMethod: 'Efectivo', isFixed: true,
    createdAt: '2026-04-05T08:00:00.000Z'
  },
  {
    id: 4, type: 'expense', category: 'servicios',
    description: 'Gas natural',
    amount: 70000, date: '2026-04-05',
    paymentMethod: 'Efectivo', isFixed: true,
    createdAt: '2026-04-05T08:30:00.000Z'
  },
  {
    id: 5, type: 'expense', category: 'internet',
    description: 'Internet hogar',
    amount: 120000, date: '2026-04-05',
    paymentMethod: 'Tarjeta débito', isFixed: true,
    createdAt: '2026-04-05T09:00:00.000Z'
  },
  {
    id: 6, type: 'expense', category: 'internet',
    description: 'Plan celular e internet del hijo',
    amount: 55000, date: '2026-04-05',
    paymentMethod: 'Nequi', isFixed: true,
    createdAt: '2026-04-05T09:30:00.000Z'
  },
  {
    id: 7, type: 'expense', category: 'otros',
    description: 'Ayuda para el chico que vive con nosotros',
    amount: 450000, date: '2026-04-01',
    paymentMethod: 'Efectivo', isFixed: true,
    createdAt: '2026-04-01T09:00:00.000Z'
  },

  // ── GASTOS VARIABLES: COMIDA / MERCADO (2026-04-05) ──
  {
    id: 8, type: 'expense', category: 'comida',
    description: 'Mercado 1',
    amount: 433000, date: '2026-04-05',
    paymentMethod: 'Tarjeta débito', isFixed: false,
    createdAt: '2026-04-05T10:00:00.000Z'
  },
  {
    id: 9, type: 'expense', category: 'comida',
    description: 'Mercado 2',
    amount: 156500, date: '2026-04-05',
    paymentMethod: 'Efectivo', isFixed: false,
    createdAt: '2026-04-05T10:30:00.000Z'
  },
  {
    id: 10, type: 'expense', category: 'comida',
    description: 'Limón (frutas)',
    amount: 7600, date: '2026-04-05',
    paymentMethod: 'Efectivo', isFixed: false,
    createdAt: '2026-04-05T11:00:00.000Z'
  },
  {
    id: 11, type: 'expense', category: 'comida',
    description: 'Otros alimentos',
    amount: 60000, date: '2026-04-05',
    paymentMethod: 'Efectivo', isFixed: false,
    createdAt: '2026-04-05T11:10:00.000Z'
  },
  {
    id: 12, type: 'expense', category: 'comida',
    description: 'Otros alimentos (varios)',
    amount: 24000, date: '2026-04-05',
    paymentMethod: 'Efectivo', isFixed: false,
    createdAt: '2026-04-05T11:20:00.000Z'
  },
  {
    id: 13, type: 'expense', category: 'comida',
    description: 'Queso',
    amount: 17000, date: '2026-04-05',
    paymentMethod: 'Efectivo', isFixed: false,
    createdAt: '2026-04-05T11:30:00.000Z'
  },
  {
    id: 14, type: 'expense', category: 'comida',
    description: 'Arándanos',
    amount: 10500, date: '2026-04-05',
    paymentMethod: 'Efectivo', isFixed: false,
    createdAt: '2026-04-05T11:40:00.000Z'
  },
  {
    id: 15, type: 'expense', category: 'comida',
    description: 'Maíz pira',
    amount: 2400, date: '2026-04-05',
    paymentMethod: 'Efectivo', isFixed: false,
    createdAt: '2026-04-05T11:50:00.000Z'
  }
];

const INITIAL_GOALS = [
  {
    id: 101,
    name: 'Casa propia 🏠',
    icon: '🏠',
    target: 0,
    saved: 0,
    deadline: '',
    color: '#C084FC',
    description: 'Ahorro para la casa. Define el monto objetivo en la sección de Ahorros.',
    contributions: []
  }
];

// ── localStorage ENGINE ──────────────────────────────────────

const DB = {
  _data: null,

  _defaults() {
    // Ordenar movimientos iniciales por fecha desc
    const sortedMovements = [...INITIAL_MOVEMENTS].sort(
      (a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00')
    );
    return {
      movements: sortedMovements,
      budgets: { ...DEFAULT_BUDGETS },
      goals: JSON.parse(JSON.stringify(INITIAL_GOALS)),
      settings: { ...DEFAULT_SETTINGS },
      categories: JSON.parse(JSON.stringify(CATEGORIES)),
      fixedExpenses: [],
      nextId: 200,
      initialized: true
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) {
        this._data = this._defaults();
        this.save();
      } else {
        this._data = JSON.parse(raw);
        if (!this._data.goals)      this._data.goals      = [];
        if (!this._data.categories) this._data.categories = JSON.parse(JSON.stringify(CATEGORIES));
        if (!this._data.budgets)    this._data.budgets    = { ...DEFAULT_BUDGETS };
        if (!this._data.fixedExpenses) this._data.fixedExpenses = [];
      }
    } catch (e) {
      console.warn('DB load error, resetting:', e);
      this._data = this._defaults();
      this.save();
    }
    return this._data;
  },

  save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this._data));
  },

  get(key)         { return this._data[key]; },
  set(key, value)  { this._data[key] = value; this.save(); },

  nextId()         { return ++this._data.nextId; },

  // ── Movement CRUD ──
  addMovement(m) {
    m.id = this.nextId();
    m.createdAt = new Date().toISOString();
    this._data.movements.unshift(m);
    this.save();
    return m;
  },

  updateMovement(id, changes) {
    const idx = this._data.movements.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this._data.movements[idx] = { ...this._data.movements[idx], ...changes };
    this.save();
    return this._data.movements[idx];
  },

  deleteMovement(id) {
    const len = this._data.movements.length;
    this._data.movements = this._data.movements.filter(m => m.id !== id);
    this.save();
    return this._data.movements.length < len;
  },

  getMovements(filters = {}) {
    let list = [...this._data.movements];
    if (filters.type)     list = list.filter(m => m.type === filters.type);
    if (filters.category) list = list.filter(m => m.category === filters.category);
    if (filters.month != null) {
      list = list.filter(m => {
        const d = new Date(m.date + 'T00:00:00');
        return d.getMonth() === filters.month;
      });
    }
    if (filters.year != null) {
      list = list.filter(m => {
        const d = new Date(m.date + 'T00:00:00');
        return d.getFullYear() === filters.year;
      });
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(m =>
        m.description.toLowerCase().includes(s) ||
        (getCategoryById(m.category)?.name || '').toLowerCase().includes(s)
      );
    }
    if (filters.dateFrom) list = list.filter(m => m.date >= filters.dateFrom);
    if (filters.dateTo)   list = list.filter(m => m.date <= filters.dateTo);
    return list;
  },

  // ── Goal CRUD ──
  addGoal(g) {
    g.id = this.nextId();
    g.saved = 0;
    g.contributions = [];
    this._data.goals.push(g);
    this.save();
    return g;
  },

  updateGoal(id, changes) {
    const idx = this._data.goals.findIndex(g => g.id === id);
    if (idx === -1) return null;
    this._data.goals[idx] = { ...this._data.goals[idx], ...changes };
    this.save();
    return this._data.goals[idx];
  },

  deleteGoal(id) {
    this._data.goals = this._data.goals.filter(g => g.id !== id);
    this.save();
  },

  addContribution(goalId, amount) {
    const goal = this._data.goals.find(g => g.id === goalId);
    if (!goal) return null;
    const contrib = { date: new Date().toISOString().split('T')[0], amount };
    goal.contributions.push(contrib);
    goal.saved += amount;
    this.save();
    return goal;
  },

  // ── Budget ──
  setBudget(category, amount) {
    this._data.budgets[category] = amount;
    this.save();
  },

  // ── Settings ──
  getSetting(key)        { return this._data.settings[key]; },
  setSetting(key, value) { this._data.settings[key] = value; this.save(); },

  // ── Fixed Expenses CRUD ──
  addFixedExpense(fe) {
    fe.id = this.nextId();
    fe.active = true;
    this._data.fixedExpenses.push(fe);
    this.save();
    return fe;
  },

  updateFixedExpense(id, changes) {
    const idx = this._data.fixedExpenses.findIndex(fe => fe.id === id);
    if (idx === -1) return null;
    this._data.fixedExpenses[idx] = { ...this._data.fixedExpenses[idx], ...changes };
    this.save();
    return this._data.fixedExpenses[idx];
  },

  deleteFixedExpense(id) {
    this._data.fixedExpenses = this._data.fixedExpenses.filter(fe => fe.id !== id);
    this.save();
  },

  processFixedExpenses(year, month) {
    const period = `${year}-${String(month + 1).padStart(2, '0')}`;
    const fixeds = this._data.fixedExpenses.filter(fe => fe.active);
    const results = { added: 0, skipped: 0 };

    fixeds.forEach(fe => {
      // Check if already exists in movements for this month
      const exists = this._data.movements.some(m => 
        m.fixedExpenseId === fe.id && 
        m.date.startsWith(period)
      );

      if (!exists) {
        // Use preferred day or default to day 1 safely within month limits
        const day = fe.day ? Math.min(fe.day, new Date(year, month + 1, 0).getDate()) : 1;
        const date = `${period}-${String(day).padStart(2, '0')}`;
        
        this.addMovement({
          type: 'expense',
          category: fe.category,
          description: `(Fijo) ${fe.name}`,
          amount: fe.amount,
          date: date,
          paymentMethod: 'Transferencia',
          isFixed: true,
          fixedExpenseId: fe.id
        });
        results.added++;
      } else {
        results.skipped++;
      }
    });

    return results;
  },

  // ── Reset ──
  reset() {
    localStorage.removeItem(DB_KEY);
    this._data = null;
    this.load();
  }
};

// ── HELPERS ─────────────────────────────────────────────────

function getCategoryById(id) {
  if (!DB._data) return null;
  return DB._data.categories.find(c => c.id === id) ||
         CATEGORIES.find(c => c.id === id) ||
         { id: 'otros', name: 'Otros', icon: '✨', color: '#D1D5DB', bg: '#F9FAFB' };
}

function formatCurrency(amount, compact = false) {
  const settings = DB._data?.settings || DEFAULT_SETTINGS;
  if (compact && Math.abs(amount) >= 1000000) {
    const m = amount / 1000000;
    return `${settings.currencySymbol}${m.toFixed(1)}M`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    const k = amount / 1000;
    return `${settings.currencySymbol}${k.toFixed(0)}K`;
  }
  return new Intl.NumberFormat(settings.currencyLocale, {
    style: 'currency',
    currency: settings.currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function getMonthName(monthIndex) {
  return ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][monthIndex];
}

function calcTotals(movements) {
  return movements.reduce((acc, m) => {
    if (m.type === 'income')  acc.income  += m.amount;
    if (m.type === 'expense') acc.expense += m.amount;
    return acc;
  }, { income: 0, expense: 0, savings: 0, balance: 0 });
}

function calcMonthTotals(year, month) {
  const movs = DB.getMovements({ year, month });
  const t = calcTotals(movs);
  t.savings = Math.max(0, t.income - t.expense);
  t.balance = t.income - t.expense;
  return t;
}

function calcCategoryTotals(movs) {
  const totals = {};
  movs.filter(m => m.type === 'expense').forEach(m => {
    totals[m.category] = (totals[m.category] || 0) + m.amount;
  });
  return totals;
}

function generateAlerts(year, month) {
  const alerts = [];
  const current  = calcMonthTotals(year, month);
  const prevDate = new Date(year, month - 1, 1);
  const prev     = calcMonthTotals(prevDate.getFullYear(), prevDate.getMonth());

  const movs    = DB.getMovements({ year, month });
  const catTotals = calcCategoryTotals(movs);
  const budgets = DB.get('budgets');

  // Ahorro subió/bajó
  if (prev.savings > 0) {
    if (current.savings > prev.savings * 1.05) {
      alerts.push({ type: 'success', icon: '🎉', title: '¡Excelente!', msg: `Ahorraste más que el mes pasado (${formatCurrency(current.savings - prev.savings)} más)` });
    } else if (current.savings < prev.savings * 0.85) {
      alerts.push({ type: 'warning', icon: '📉', title: 'Ahorro bajo', msg: `Tu ahorro bajó respecto al mes pasado (${formatCurrency(prev.savings - current.savings)} menos)` });
    }
  }

  // Categoría que más gastó
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0) {
    const [topCat, topAmt] = sortedCats[0];
    const cat = getCategoryById(topCat);
    const pct = current.expense > 0 ? Math.round(topAmt / current.expense * 100) : 0;
    alerts.push({ type: 'info', icon: cat?.icon || '💸', title: `Mayor gasto: ${cat?.name}`, msg: `La categoría ${cat?.name} representa el ${pct}% de tus gastos este mes (${formatCurrency(topAmt)})` });
  }

  // Presupuesto por categoría
  Object.entries(catTotals).forEach(([catId, spent]) => {
    const budget = budgets[catId];
    if (!budget) return;
    const pct = spent / budget;
    if (pct > 1) {
      const cat = getCategoryById(catId);
      alerts.push({ type: 'danger', icon: '🚨', title: `Límite superado: ${cat?.name}`, msg: `Gastaste ${formatCurrency(spent)} de ${formatCurrency(budget)} presupuestado (${Math.round(pct*100)}%)` });
    } else if (pct > 0.85) {
      const cat = getCategoryById(catId);
      alerts.push({ type: 'warning', icon: '⚠️', title: `Cerca del límite: ${cat?.name}`, msg: `Ya usaste el ${Math.round(pct*100)}% del presupuesto en ${cat?.name}` });
    }
  });

  // Gastos fijos
  const fixedTotal = movs.filter(m => m.isFixed && m.type === 'expense').reduce((s, m) => s + m.amount, 0);
  if (fixedTotal > 0 && current.income > 0) {
    const pct = Math.round(fixedTotal / current.income * 100);
    if (pct < 35) {
      alerts.push({ type: 'success', icon: '🏆', title: '¡Maestra del ahorro!', msg: `Tus gastos fijos solo ocupan el ${pct}% de tus ingresos. Tienes un gran margen para ahorrar.` });
    } else if (pct < 60) {
      alerts.push({ type: 'success', icon: '✅', title: 'Gastos fijos estables', msg: `Tus gastos fijos son el ${pct}% de tus ingresos. Un nivel muy saludable.` });
    }
  }

  // Ahorro potencial (50/30/20 rule)
  if (current.income > 0 && current.balance > current.income * 0.2) {
    alerts.push({ type: 'info', icon: '💰', title: 'Oportunidad de ahorro', msg: 'Este mes te sobra más del 20% de tus ingresos. Es un momento ideal para aportar a tu meta.' });
  }
  
  if (current.income > 0 && (current.income - current.expense) / current.income > 0.3) {
    alerts.push({ type: 'success', icon: '🌟', title: '¡Gran capacidad de ahorro!', msg: 'Estás ahorrando más del 30% de tus ingresos. ¡Vas por muy buen camino!' });
  }

  return alerts.slice(0, 4);
}

function generateInsights(year, month) {
  const movs   = DB.getMovements({ year, month });
  const totals = calcMonthTotals(year, month);
  const catTotals = calcCategoryTotals(movs);
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const insights = [];
  const name = DB.getSetting('userName') || 'Diana';

  if (sorted.length > 0) {
    const [topCat, topAmt] = sorted[0];
    const cat = getCategoryById(topCat);
    const pct = totals.expense > 0 ? Math.round(topAmt / totals.expense * 100) : 0;
    insights.push(`Este mes tu mayor gasto fue <strong>${cat?.name}</strong> con ${formatCurrency(topAmt)} (${pct}% del total)`);
  }

  if (totals.balance > 0) {
    insights.push(`🔴 Tu balance este mes es negativo: ${formatCurrency(totals.balance)}`);
  }

  return insights;
}

// Export globals
window.DB           = DB;
window.CATEGORIES   = CATEGORIES;
window.PAYMENT_METHODS = PAYMENT_METHODS;
window.getCategoryById  = getCategoryById;
window.formatCurrency   = formatCurrency;
window.formatDate       = formatDate;
window.formatDateShort  = formatDateShort;
window.getMonthName     = getMonthName;
window.calcTotals       = calcTotals;
window.calcMonthTotals  = calcMonthTotals;
window.calcCategoryTotals = calcCategoryTotals;
window.generateAlerts   = generateAlerts;
window.generateInsights = generateInsights;
