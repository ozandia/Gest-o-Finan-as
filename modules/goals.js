/**
 * FinFlow - Módulo de Metas Financeiras e Cofres (Goals & Dreams)
 */

import { formatCurrency, formatDate, showToast } from './utils.js';

export function renderGoalsView(state, onStateChange, onEditGoal, onDepositGoal) {
  const container = document.getElementById('goals-container');
  const totalAccEl = document.getElementById('goals-total-accumulated');
  const totalTargetEl = document.getElementById('goals-total-target');
  const generalPercentEl = document.getElementById('goals-general-percent');

  if (!container) return;

  const { goals } = state;

  const totalAccumulated = goals.reduce((sum, g) => sum + Number(g.current || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target || 0), 0);
  const generalPercent = totalTarget > 0 ? ((totalAccumulated / totalTarget) * 100).toFixed(1) : 0;

  if (totalAccEl) totalAccEl.textContent = formatCurrency(totalAccumulated);
  if (totalTargetEl) totalTargetEl.textContent = formatCurrency(totalTarget);
  if (generalPercentEl) generalPercentEl.textContent = `${generalPercent}%`;

  if (goals.length === 0) {
    container.innerHTML = `
      <div class="card text-center text-muted" style="grid-column: 1 / -1; padding: 40px;">
        <i data-lucide="target" style="width: 40px; height: 40px; margin-bottom: 10px;"></i>
        <p>Você ainda não tem metas cadastradas. Clique em "Nova Meta" para estipular seus objetivos!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = goals.map(goal => {
    const current = Number(goal.current || 0);
    const target = Number(goal.target || 0);
    const percent = target > 0 ? Math.min(100, (current / target) * 100).toFixed(1) : 0;
    const remaining = Math.max(0, target - current);
    const isCompleted = current >= target;

    return `
      <div class="goal-card">
        <div class="goal-card-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="goal-icon-box">
              <i data-lucide="${goal.icon || 'target'}"></i>
            </div>
            <div>
              <h4 class="goal-card-title">${goal.name}</h4>
              <span class="goal-deadline-tag">
                <i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; vertical-align: -2px;"></i>
                Meta: ${formatDate(goal.deadline)}
              </span>
            </div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="btn-icon-tiny" data-action="edit-goal" data-id="${goal.id}" title="Editar Meta">
              <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="btn-icon-tiny text-danger" data-action="delete-goal" data-id="${goal.id}" title="Excluir">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>

        <div>
          <div class="goal-numbers">
            <div>
              <span class="text-muted" style="font-size: 0.75rem;">ACUMULADO</span>
              <div class="goal-saved-val text-success">${formatCurrency(current)}</div>
            </div>
            <div class="text-right">
              <span class="text-muted" style="font-size: 0.75rem;">OBJETIVO</span>
              <div class="goal-target-val">${formatCurrency(target)}</div>
            </div>
          </div>

          <div class="progress-track" style="margin-top: 10px; height: 10px;">
            <div class="progress-bar ${isCompleted ? 'safe' : 'safe'}" style="width: ${percent}%; background: linear-gradient(90deg, #10b981, #06b6d4);"></div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px;">
          <span class="badge ${isCompleted ? 'bg-success-soft text-success' : ''}">
            ${isCompleted ? '🎉 Concluída!' : `${percent}% atingido`}
          </span>
          <span class="text-muted" style="font-size: 0.8rem;">
            ${isCompleted ? 'Parabéns!' : `Faltam ${formatCurrency(remaining)}`}
          </span>
        </div>

        <button class="btn btn-secondary" style="width: 100%; margin-top: 4px;" data-action="deposit-goal" data-id="${goal.id}">
          <i data-lucide="plus"></i>
          <span>Guardar Dinheiro</span>
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-action="edit-goal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const g = state.goals.find(item => item.id === id);
      if (g && onEditGoal) onEditGoal(g);
    });
  });

  container.querySelectorAll('[data-action="deposit-goal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const g = state.goals.find(item => item.id === id);
      if (g && onDepositGoal) onDepositGoal(g);
    });
  });

  container.querySelectorAll('[data-action="delete-goal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Tem certeza que deseja excluir esta meta?')) {
        state.goals = state.goals.filter(g => g.id !== id);
        onStateChange();
        showToast('Meta excluída com sucesso.', 'info');
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}
