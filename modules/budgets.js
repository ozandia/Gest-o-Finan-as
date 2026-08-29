/**
 * FinFlow - Módulo de Planejamento de Orçamentos (Budgets)
 */

import { formatCurrency, showToast } from './utils.js';

export function calculateBudgetStats(state, periodOption = 'current-month') {
  const { transactions, categories, budgets } = state;
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  // Filtrar despesas pagas no período
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const periodTxs = transactions.filter(t => {
    if (t.type !== 'expense' || t.status !== 'paid') return false;
    const [tY, tM] = t.date.split('-').map(Number);
    return tY === curYear && (tM - 1) === curMonth;
  });

  const spentPerCat = {};
  periodTxs.forEach(t => {
    spentPerCat[t.categoryId] = (spentPerCat[t.categoryId] || 0) + Number(t.amount);
  });

  const budgetDetails = budgets.map(b => {
    const cat = catMap[b.categoryId] || { name: 'Categoria', color: '#6366f1', icon: 'tag' };
    const spent = spentPerCat[b.categoryId] || 0;
    const limit = Number(b.limit || 0);
    const remaining = limit - spent;
    const percent = limit > 0 ? (spent / limit) * 100 : 0;

    let status = 'safe'; // verde
    if (percent >= 100) {
      status = 'danger'; // vermelho
    } else if (percent >= 75) {
      status = 'warning'; // amarelo
    }

    return {
      id: b.id,
      categoryId: b.categoryId,
      categoryName: cat.name,
      categoryColor: cat.color,
      categoryIcon: cat.icon,
      limit,
      spent,
      remaining,
      percent: Math.min(percent, 100).toFixed(1),
      realPercent: percent.toFixed(1),
      status
    };
  });

  const totalPlanned = budgets.reduce((sum, b) => sum + Number(b.limit), 0);
  const totalSpent = budgetDetails.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = Math.max(0, totalPlanned - totalSpent);

  return { budgetDetails, totalPlanned, totalSpent, totalRemaining };
}

export function renderBudgetsView(state, onStateChange, onEditBudget) {
  const container = document.getElementById('budgets-container');
  const totalPlannedEl = document.getElementById('budget-total-planned');
  const totalSpentEl = document.getElementById('budget-total-spent');
  const totalRemainingEl = document.getElementById('budget-total-remaining');

  const { budgetDetails, totalPlanned, totalSpent, totalRemaining } = calculateBudgetStats(state);

  if (totalPlannedEl) totalPlannedEl.textContent = formatCurrency(totalPlanned);
  if (totalSpentEl) totalSpentEl.textContent = formatCurrency(totalSpent);
  if (totalRemainingEl) totalRemainingEl.textContent = formatCurrency(totalRemaining);

  if (!container) return;

  if (budgetDetails.length === 0) {
    container.innerHTML = `
      <div class="card text-center text-muted" style="grid-column: 1 / -1; padding: 40px;">
        <i data-lucide="pie-chart" style="width: 40px; height: 40px; margin-bottom: 10px;"></i>
        <p>Nenhum orçamento configurado ainda. Clique em "Novo Orçamento" para começar.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = budgetDetails.map(b => {
    const isExceeded = b.spent > b.limit;

    return `
      <div class="budget-card">
        <div class="budget-card-top">
          <div class="budget-card-cat">
            <span style="width: 12px; height: 12px; border-radius: 50%; background: ${b.categoryColor};"></span>
            <span>${b.categoryName}</span>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="btn-icon-tiny" data-action="edit-budget" data-id="${b.id}" title="Editar limite">
              <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="btn-icon-tiny text-danger" data-action="delete-budget" data-id="${b.id}" title="Excluir">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>

        <div>
          <div class="budget-values-row">
            <span class="text-muted">Gasto: <strong class="font-mono ${isExceeded ? 'text-danger' : ''}">${formatCurrency(b.spent)}</strong></span>
            <span class="text-muted">Limite: <strong class="font-mono">${formatCurrency(b.limit)}</strong></span>
          </div>

          <div class="progress-track">
            <div class="progress-bar ${b.status}" style="width: ${b.percent}%;"></div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
          <span class="badge ${b.status === 'danger' ? 'text-danger' : (b.status === 'warning' ? 'text-warning' : 'text-success')}">
            ${b.realPercent}% consumido
          </span>
          <span class="text-muted">
            ${isExceeded 
              ? `<strong class="text-danger">Excedido em ${formatCurrency(b.spent - b.limit)}</strong>` 
              : `Resta <strong>${formatCurrency(b.remaining)}</strong>`}
          </span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-action="edit-budget"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const b = state.budgets.find(item => item.id === id);
      if (b && onEditBudget) onEditBudget(b);
    });
  });

  container.querySelectorAll('[data-action="delete-budget"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Deseja remover este orçamento?')) {
        state.budgets = state.budgets.filter(b => b.id !== id);
        onStateChange();
        showToast('Orçamento excluído.', 'info');
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

export function renderDashboardBudgets(state) {
  const miniList = document.getElementById('dashboard-budget-list');
  if (!miniList) return;

  const { budgetDetails } = calculateBudgetStats(state);
  
  if (budgetDetails.length === 0) {
    miniList.innerHTML = `<p class="text-muted text-center" style="padding: 12px;">Nenhum orçamento configurado.</p>`;
    return;
  }

  // Ordenar pelos mais consumidos primeiro
  const sorted = [...budgetDetails].sort((a, b) => Number(b.realPercent) - Number(a.realPercent)).slice(0, 3);

  miniList.innerHTML = sorted.map(b => `
    <div class="budget-mini-item">
      <div class="budget-mini-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${b.categoryColor};"></span>
          <strong>${b.categoryName}</strong>
        </div>
        <span class="font-mono text-muted" style="font-size: 0.8rem;">${formatCurrency(b.spent)} / ${formatCurrency(b.limit)}</span>
      </div>
      <div class="progress-track">
        <div class="progress-bar ${b.status}" style="width: ${b.percent}%;"></div>
      </div>
    </div>
  `).join('');
}
