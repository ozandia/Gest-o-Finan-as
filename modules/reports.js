/**
 * FinFlow - Módulo de Relatórios e Demonstrativo de Resultado (DRE Pessoal)
 */

import { formatCurrency } from './utils.js';

export function renderReportsView(state, periodOption = 'current-month') {
  const { transactions, categories } = state;
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  // Filtrar transações pagas no período
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const filteredTxs = transactions.filter(t => {
    if (t.status !== 'paid') return false;
    const [tY, tM] = t.date.split('-').map(Number);

    switch (periodOption) {
      case 'current-month':
        return tY === curYear && (tM - 1) === curMonth;
      case 'last-month': {
        const lastM = new Date(curYear, curMonth - 1, 1);
        return tY === lastM.getFullYear() && (tM - 1) === lastM.getMonth();
      }
      case 'current-year':
        return tY === curYear;
      case 'all':
      default:
        return true;
    }
  });

  // DRE Categorization
  let totalIncome = 0;
  let fixedIncome = 0;
  let extraIncome = 0;

  let totalEssentialExpenses = 0;
  let totalLifestyleExpenses = 0;

  const categoryExpenses = {};

  filteredTxs.forEach(tx => {
    const amt = Number(tx.amount || 0);

    if (tx.type === 'income') {
      totalIncome += amt;
      if (tx.categoryId === 'cat_salary' || tx.categoryId === 'cat_salary_ju' || tx.categoryId === 'cat_salary_ozi') {
        fixedIncome += amt;
      } else {
        extraIncome += amt;
      }
    } else if (tx.type === 'expense') {
      const cat = catMap[tx.categoryId];
      if (cat && cat.essential) {
        totalEssentialExpenses += amt;
      } else {
        totalLifestyleExpenses += amt;
      }

      categoryExpenses[tx.categoryId] = (categoryExpenses[tx.categoryId] || 0) + amt;
    }
  });

  const totalExpense = totalEssentialExpenses + totalLifestyleExpenses;
  const netResult = totalIncome - totalExpense;

  // Atualizar DRE Table Elements
  const elTotalIncome = document.getElementById('dre-total-income');
  const elFixedIncome = document.getElementById('dre-fixed-income');
  const elExtraIncome = document.getElementById('dre-extra-income');
  const elEssentialExp = document.getElementById('dre-essential-expenses');
  const elEssentialDetail = document.getElementById('dre-essential-detail');
  const elLifestyleExp = document.getElementById('dre-lifestyle-expenses');
  const elLifestyleDetail = document.getElementById('dre-lifestyle-detail');
  const elNetResult = document.getElementById('dre-net-result');

  if (elTotalIncome) elTotalIncome.textContent = formatCurrency(totalIncome);
  if (elFixedIncome) elFixedIncome.textContent = formatCurrency(fixedIncome);
  if (elExtraIncome) elExtraIncome.textContent = formatCurrency(extraIncome);
  if (elEssentialExp) elEssentialExp.textContent = `-${formatCurrency(totalEssentialExpenses)}`;
  if (elEssentialDetail) elEssentialDetail.textContent = formatCurrency(totalEssentialExpenses);
  if (elLifestyleExp) elLifestyleExp.textContent = `-${formatCurrency(totalLifestyleExpenses)}`;
  if (elLifestyleDetail) elLifestyleDetail.textContent = formatCurrency(totalLifestyleExpenses);

  if (elNetResult) {
    elNetResult.textContent = (netResult >= 0 ? '+' : '') + formatCurrency(netResult);
    elNetResult.className = `money-value font-mono font-bold ${netResult >= 0 ? 'text-success' : 'text-danger'}`;
  }

  // Ranking de Categorias
  const rankingContainer = document.getElementById('report-category-ranking');
  if (rankingContainer) {
    const rankedList = Object.entries(categoryExpenses)
      .map(([catId, spent]) => {
        const cat = catMap[catId] || { name: 'Outros', color: '#6366f1' };
        return { name: cat.name, color: cat.color, spent, pct: totalExpense > 0 ? (spent / totalExpense * 100).toFixed(1) : 0 };
      })
      .sort((a, b) => b.spent - a.spent);

    if (rankedList.length === 0) {
      rankingContainer.innerHTML = `<p class="text-muted text-center" style="padding: 20px;">Nenhum gasto registrado neste período.</p>`;
    } else {
      rankingContainer.innerHTML = rankedList.map((item, idx) => `
        <div class="category-ranking-item">
          <div style="display: flex; align-items: center; gap: 10px;">
            <strong style="width: 20px; color: var(--text-dim);">#${idx + 1}</strong>
            <span class="legend-color-dot" style="background: ${item.color};"></span>
            <strong>${item.name}</strong>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="font-mono font-bold">${formatCurrency(item.spent)}</span>
            <span class="badge">${item.pct}%</span>
          </div>
        </div>
      `).join('');
    }
  }
}
