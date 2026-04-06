/* ============================================================
   FINANZA PERSONAL — js/savings.js
   Metas de ahorro: CRUD + aportes + progreso visual
   ============================================================ */

'use strict';

window.SavingsPage = {

  editingGoalId: null,

  init() {
    this.render();
  },

  render() {
    const el = document.getElementById('savings-page');
    if (!el) return;

    const goals = DB.get('goals');
    const totalSaved  = goals.reduce((a, g) => a + g.saved, 0);
    const totalTarget = goals.reduce((a, g) => a + g.target, 0);

    const motivations = [
      '¡Cada peso cuenta! 💪',
      'El ahorro de hoy es la libertad de mañana ✨',
      'Vas por buen camino, sigue así 🌸',
      '¡Tu futura yo te lo agradecerá! 💜'
    ];
    const tip = motivations[Math.floor(Math.random() * motivations.length)];

    el.innerHTML = `
      <div class="page-wrapper">
        <div class="page-header">
          <div class="page-header-info">
            <h1>🎯 Metas de Ahorro</h1>
            <p>${tip}</p>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-primary" onclick="SavingsPage.openAddGoal()">➕ Nueva meta</button>
          </div>
        </div>

        <!-- Summary -->
        <div class="grid grid-3 mb-6">
          <div class="card" style="text-align:center;padding:18px">
            <span style="font-size:1.8rem">🎯</span>
            <div style="font-size:1.4rem;font-weight:800;color:var(--primary-dark);margin-top:6px">${goals.length}</div>
            <div class="text-xs text-muted font-bold mt-1">METAS ACTIVAS</div>
          </div>
          <div class="card" style="text-align:center;padding:18px">
            <span style="font-size:1.8rem">💰</span>
            <div style="font-size:1.4rem;font-weight:800;color:#059669;margin-top:6px">${formatCurrency(totalSaved)}</div>
            <div class="text-xs text-muted font-bold mt-1">TOTAL AHORRADO</div>
          </div>
          <div class="card" style="text-align:center;padding:18px">
            <span style="font-size:1.8rem">📈</span>
            <div style="font-size:1.4rem;font-weight:800;color:var(--accent-dark);margin-top:6px">
              ${totalTarget > 0 ? Math.round(totalSaved / totalTarget * 100) : (totalSaved > 0 ? 100 : 0)}%
            </div>
            <div class="text-xs text-muted font-bold mt-1">PROGRESO GLOBAL</div>
          </div>
        </div>

        <!-- Goals grid -->
        ${goals.length ? `
          <div class="grid grid-3" id="goals-grid">
            ${goals.map(g => this.renderGoalCard(g)).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <span class="empty-icon">🎯</span>
            <h3>Sin metas de ahorro</h3>
            <p>Crea tu primera meta y empieza a ahorrar.</p>
            <button class="btn btn-primary mt-4" onclick="SavingsPage.openAddGoal()">➕ Crear primera meta</button>
          </div>
        `}

        <!-- Add/Edit Goal Modal -->
        ${this.renderGoalModal()}

        <!-- Contribute Modal -->
        ${this.renderContribModal()}
      </div>`;
  },

  renderGoalCard(g) {
    const pct = g.target > 0 ? Math.min(100, Math.round(g.saved / g.target * 100)) : 0;
    const left = Math.max(0, g.target - g.saved);
    
    let daysLeft = null;
    let monthsLeft = null;
    let monthlyNeeded = 0;
    let statusHtml = '';

    if (g.deadline) {
      const limit = new Date(g.deadline + 'T00:00:00');
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const diffTime = limit - today;
      daysLeft = Math.ceil(diffTime / 86400000);
      
      if (daysLeft > 0) {
        monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
        monthlyNeeded = left / monthsLeft;
      }
    }

    if (g.target > 0) {
      if (left > 0) {
        statusHtml = `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light);font-size:.78rem;color:var(--muted);font-weight:600">
            Faltan ${formatCurrency(left)} para la meta
            ${monthlyNeeded > 0 ? `<br><span style="color:#059669">Debes ahorrar ${formatCurrency(monthlyNeeded)} por mes para llegar a tiempo (${monthsLeft} meses)</span>` : ''}
          </div>`;
      } else {
        statusHtml = `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light);text-align:center">
            <span style="font-size:.85rem;font-weight:800;color:#059669">🎉 ¡Meta cumplida!</span>
          </div>`;
      }
    } else {
      statusHtml = `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light);text-align:center;font-size:.75rem;color:var(--muted)">
          Haz clic en ✏️ para definir un monto
        </div>`;
    }

    return `
      <div class="goal-card">
        <div class="goal-card-header">
          <div class="goal-icon" style="background:linear-gradient(135deg,${g.color}22,${g.color}44)">${g.icon}</div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-icon" onclick="SavingsPage.openEditGoal(${g.id})" title="Editar">✏️</button>
            <button class="btn btn-ghost btn-icon" onclick="SavingsPage.deleteGoal(${g.id})" title="Eliminar">🗑️</button>
          </div>
        </div>
        <div class="goal-title">${g.name}</div>
        <div class="goal-sub">${g.description || ''}</div>

        <div class="goal-amounts">
          <div>
            <div style="font-size:.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Ahorrado</div>
            <div class="goal-saved" style="color:${g.color}">${formatCurrency(g.saved)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Meta</div>
            <div class="goal-target">${g.target > 0 ? formatCurrency(g.target) : '<span class="text-xs text-muted">Pendiente</span>'}</div>
          </div>
        </div>

        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${g.color},${g.color}99)"></div>
        </div>

        <div class="goal-footer">
          <div class="goal-percent" style="background:${g.color}18;color:${g.color}">
            ${g.target > 0 ? pct + '% logrado' : 'Define tu meta'}
          </div>
          <div class="goal-deadline">
            ${daysLeft !== null ? (daysLeft > 0 ? `⏳ ${daysLeft} días` : '⏰ ¡Hoy es la fecha!') : ''}
          </div>
        </div>

        ${statusHtml}

        <button class="btn btn-primary btn-sm" style="width:100%;margin-top:12px" onclick="SavingsPage.openContrib(${g.id})">
          💰 Agregar aporte
        </button>
      </div>`;
  },

  renderGoalModal() {
    const iconOptions = ['🛡️','🏖️','🎓','🏠','🚗','✈️','💊','📱','🎁','💍','🌟','🎯','💜','🌈'];
    return `
      <div class="modal-overlay hidden" id="goal-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 id="goal-modal-title">🎯 Nueva meta de ahorro</h3>
            <button class="modal-close" onclick="closeModal('goal-modal')">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nombre de la meta <span>*</span></label>
              <input class="form-control" id="goal-name" type="text" placeholder="Ej: Vacaciones en la playa">
            </div>
            <div class="form-group">
              <label class="form-label">Descripción</label>
              <input class="form-control" id="goal-desc" type="text" placeholder="Un pequeño detalle de tu meta">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Monto meta <span>*</span></label>
                <input class="form-control" id="goal-target" type="number" placeholder="0" min="0" step="10000">
              </div>
              <div class="form-group">
                <label class="form-label">Fecha límite</label>
                <input class="form-control" id="goal-deadline" type="date">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Ícono</label>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
                ${iconOptions.map(ic => `
                  <button type="button" onclick="SavingsPage.selectIcon('${ic}', this)"
                    style="width:38px;height:38px;border-radius:10px;border:2px solid var(--border);background:var(--bg);font-size:1.3rem;cursor:pointer;transition:var(--transition)"
                    class="icon-option">${ic}</button>`).join('')}
              </div>
              <input type="hidden" id="goal-icon" value="🎯">
            </div>
            <div class="form-group">
              <label class="form-label">Color</label>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${['#C084FC','#F9A8D4','#FDBA74','#6EE7B7','#93C5FD','#FCA5A5','#A5B4FC','#86EFAC'].map(cl => `
                  <button type="button" onclick="SavingsPage.selectColor('${cl}', this)"
                    style="width:32px;height:32px;border-radius:50%;background:${cl};border:3px solid transparent;cursor:pointer;transition:var(--transition)"
                    class="color-option"></button>`).join('')}
              </div>
              <input type="hidden" id="goal-color" value="#C084FC">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('goal-modal')">Cancelar</button>
            <button class="btn btn-primary" onclick="SavingsPage.saveGoal()">💾 Guardar meta</button>
          </div>
        </div>
      </div>`;
  },

  renderContribModal() {
    return `
      <div class="modal-overlay hidden" id="contrib-modal">
        <div class="modal" style="max-width:400px">
          <div class="modal-header">
            <h3 id="contrib-title">💰 Agregar aporte</h3>
            <button class="modal-close" onclick="closeModal('contrib-modal')">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Monto a agregar <span>*</span></label>
              <input class="form-control" id="contrib-amount" type="number" placeholder="0" min="0" step="10000">
              <div class="form-hint">Ingresa el monto que quieres agregar a esta meta</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('contrib-modal')">Cancelar</button>
            <button class="btn btn-primary" onclick="SavingsPage.saveContrib()">✅ Agregar</button>
          </div>
        </div>
      </div>`;
  },

  selectIcon(icon, btn) {
    document.getElementById('goal-icon').value = icon;
    document.querySelectorAll('.icon-option').forEach(b => b.style.borderColor = 'var(--border)');
    btn.style.borderColor = 'var(--primary)';
    btn.style.background  = 'var(--primary-light)';
  },

  selectColor(color, btn) {
    document.getElementById('goal-color').value = color;
    document.querySelectorAll('.color-option').forEach(b => b.style.borderColor = 'transparent');
    btn.style.borderColor = 'var(--text)';
  },

  openAddGoal() {
    this.editingGoalId = null;
    document.getElementById('goal-modal-title').textContent = '🎯 Nueva meta de ahorro';
    ['goal-name','goal-desc','goal-target'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('goal-deadline').value = '';
    document.getElementById('goal-icon').value  = '🎯';
    document.getElementById('goal-color').value = '#C084FC';
    openModal('goal-modal');
  },

  openEditGoal(id) {
    const g = DB.get('goals').find(g => g.id === id);
    if (!g) return;
    this.editingGoalId = id;
    document.getElementById('goal-modal-title').textContent = '✏️ Editar meta';
    document.getElementById('goal-name').value     = g.name;
    document.getElementById('goal-desc').value     = g.description || '';
    document.getElementById('goal-target').value   = g.target;
    document.getElementById('goal-deadline').value = g.deadline || '';
    document.getElementById('goal-icon').value     = g.icon;
    document.getElementById('goal-color').value    = g.color;
    openModal('goal-modal');
  },

  saveGoal() {
    const name     = document.getElementById('goal-name')?.value?.trim();
    const desc     = document.getElementById('goal-desc')?.value?.trim();
    const target   = parseFloat(document.getElementById('goal-target')?.value);
    const deadline = document.getElementById('goal-deadline')?.value;
    const icon     = document.getElementById('goal-icon')?.value || '🎯';
    const color    = document.getElementById('goal-color')?.value || '#C084FC';

    if (!name) { showToast('Escribe el nombre de la meta', 'error'); return; }
    // No longer requiring target > 0, to allow Diana to set it later
    const targetVal = isNaN(target) ? 0 : target;
    const data = { name, description: desc, target: Math.max(0, targetVal), deadline, icon, color };

    if (this.editingGoalId) {
      DB.updateGoal(this.editingGoalId, data);
      showToast('Meta actualizada 💜', 'success');
    } else {
      DB.addGoal(data);
      showToast('¡Nueva meta creada! 🎯', 'success');
    }

    closeModal('goal-modal');
    this.render();
  },

  _contribGoalId: null,

  openContrib(goalId) {
    this._contribGoalId = goalId;
    const g = DB.get('goals').find(g => g.id === goalId);
    if (g) document.getElementById('contrib-title').textContent = `💰 Aporte para: ${g.name}`;
    document.getElementById('contrib-amount').value = '';
    openModal('contrib-modal');
  },

  saveContrib() {
    const amount = parseFloat(document.getElementById('contrib-amount')?.value);
    if (!amount || amount <= 0) { showToast('Ingresa un monto válido', 'error'); return; }
    DB.addContribution(this._contribGoalId, amount);
    closeModal('contrib-modal');
    showToast(`¡Aporte de ${formatCurrency(amount)} registrado! 💪`, 'success');
    this.render();
  },

  deleteGoal(id) {
    if (!confirm('¿Eliminar esta meta de ahorro?')) return;
    DB.deleteGoal(id);
    showToast('Meta eliminada', 'warning');
    this.render();
  }
};
