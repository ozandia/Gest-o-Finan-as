/**
 * FinFlow - Módulo de Gráficos Interativos (Chart.js)
 */

import { formatCurrency } from './utils.js';

let cashflowChartInstance = null;
let categoryChartInstance = null;

export function renderCashflowChart(transactions, range = '6months') {
  const canvas = document.getElementById('canvas-cashflow');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (cashflowChartInstance) {
    cashflowChartInstance.destroy();
  }

  // Agrupar dados por meses (6 ou 12 meses)
  const monthCount = range === 'year' ? 12 : 6;
  const labels = [];
  const incomeData = [];
  const expenseData = [];

  const now = new Date();
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d);
    const yLabel = d.getFullYear().toString().slice(-2);
    labels.push(`${mLabel}/${yLabel}`);

    // Filtrar transações desse mês
    const y = d.getFullYear();
    const m = d.getMonth();

    const mIncome = transactions
      .filter(t => {
        if (t.type !== 'income' || t.status !== 'paid') return false;
        const [tY, tM] = t.date.split('-').map(Number);
        return tY === y && (tM - 1) === m;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const mExpense = transactions
      .filter(t => {
        if (t.type !== 'expense' || t.status !== 'paid') return false;
        const [tY, tM] = t.date.split('-').map(Number);
        return tY === y && (tM - 1) === m;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    incomeData.push(mIncome);
    expenseData.push(mExpense);
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#9ca3af' : '#6b7280';

  cashflowChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        },
        {
          label: 'Despesas',
          data: expenseData,
          backgroundColor: 'rgba(244, 63, 94, 0.85)',
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: textColor,
            usePointStyle: true,
            boxWidth: 8,
            font: { family: 'Plus Jakarta Sans', weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#111827' : '#ffffff',
          titleColor: isDark ? '#f3f4f6' : '#111827',
          bodyColor: isDark ? '#9ca3af' : '#4b5563',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              return ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'JetBrains Mono', size: 11 },
            callback: function (val) {
              return 'R$ ' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val);
            }
          }
        }
      }
    }
  });
}

export function renderCategoryChart(transactions, categories) {
  const canvas = document.getElementById('canvas-categories');
  const legendContainer = document.getElementById('dashboard-categories-legend');
  if (!canvas || !legendContainer) return;

  const ctx = canvas.getContext('2d');
  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  // Filtrar apenas despesas pagas
  const expenseTxs = transactions.filter(t => t.type === 'expense' && t.status === 'paid');
  
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = { ...c, total: 0 }; });

  expenseTxs.forEach(t => {
    if (catMap[t.categoryId]) {
      catMap[t.categoryId].total += Number(t.amount || 0);
    } else {
      if (!catMap['cat_other']) {
        catMap['cat_other'] = { name: 'Outros', color: '#6b7280', total: 0 };
      }
      catMap['cat_other'].total += Number(t.amount || 0);
    }
  });

  const activeCategories = Object.values(catMap)
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const totalExpense = activeCategories.reduce((sum, c) => sum + c.total, 0);

  if (activeCategories.length === 0) {
    legendContainer.innerHTML = `
      <div class="text-muted text-center" style="padding: 20px;">
        <i data-lucide="info" style="width: 24px; height: 24px; margin-bottom: 4px;"></i>
        <p>Nenhuma despesa paga neste período.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const labels = activeCategories.map(c => c.name);
  const data = activeCategories.map(c => c.total);
  const bgColors = activeCategories.map(c => c.color || '#6366f1');

  // Renderizar legenda HTML customizada
  legendContainer.innerHTML = activeCategories.map(c => {
    const percent = totalExpense > 0 ? ((c.total / totalExpense) * 100).toFixed(1) : 0;
    return `
      <div class="legend-item">
        <div style="display: flex; align-items: center; min-width: 0;">
          <span class="legend-color-dot" style="background-color: ${c.color};"></span>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;" title="${c.name}">${c.name}</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="font-mono font-semibold">${formatCurrency(c.total)}</span>
          <span class="badge">${percent}%</span>
        </div>
      </div>
    `;
  }).join('');

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: isDark ? '#111728' : '#ffffff',
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#111827' : '#ffffff',
          titleColor: isDark ? '#f3f4f6' : '#111827',
          bodyColor: isDark ? '#9ca3af' : '#4b5563',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function (context) {
              const val = context.raw;
              const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${formatCurrency(val)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}
