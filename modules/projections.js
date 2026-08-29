/**
 * Gestão Financeira - Módulo de Simulador, Projeções e Carteira de Investimentos da Família Martins
 */

import { formatCurrency, formatDate, generateId, showToast } from './utils.js';

let projectionChartInstance = null;

export function initProjections(state, onStateChange) {
  renderInvestmentsList(state, onStateChange);
  initInvestmentFormListeners(state, onStateChange);
  initSimulationSliders(state);
}

/**
 * Renderiza a Lista e Métricas da Carteira de Investimentos Cadastrada
 */
export function renderInvestmentsList(state, onStateChange) {
  const container = document.getElementById('investments-portfolio-list');
  const kpiPortfolioTotal = document.getElementById('kpi-investments-total');
  const kpiPassiveIncome = document.getElementById('proj-kpi-passive-income');
  const kpiWeightedYield = document.getElementById('kpi-investments-yield');

  if (!state.investments) state.investments = [];

  const investments = state.investments;
  const totalInvested = investments.reduce((sum, inv) => sum + (Number(inv.currentAmount) || 0), 0);
  const totalMonthlyDeposits = investments.reduce((sum, inv) => sum + (Number(inv.monthlyDeposit) || 0), 0);

  // Rentabilidade média ponderada
  let weightedYield = 0;
  if (totalInvested > 0) {
    const totalYieldProduct = investments.reduce((sum, inv) => sum + ((Number(inv.currentAmount) || 0) * (Number(inv.annualYield) || 0)), 0);
    weightedYield = totalYieldProduct / totalInvested;
  }

  // Renda passiva mensal gerada pela carteira atual
  const monthlyRate = weightedYield > 0 ? Math.pow(1 + (weightedYield / 100), 1 / 12) - 1 : 0;
  const currentPassiveIncome = totalInvested * monthlyRate;

  if (kpiPortfolioTotal) kpiPortfolioTotal.textContent = formatCurrency(totalInvested);
  if (kpiWeightedYield) kpiWeightedYield.textContent = `${weightedYield.toFixed(1)}% a.a.`;
  if (kpiPassiveIncome) kpiPassiveIncome.textContent = `${formatCurrency(currentPassiveIncome)}/mês`;

  // Atualizar Lista
  if (!container) return;

  if (investments.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box" style="padding: 28px 16px; text-align: center;">
        <i data-lucide="coins" class="text-muted" style="width: 40px; height: 40px; margin-bottom: 8px;"></i>
        <p class="text-muted" style="font-size: 0.88rem;">Nenhum investimento cadastrado ainda.</p>
        <p class="text-muted" style="font-size: 0.78rem; margin-top: 4px;">Cadastre CDBs (C6, Mercado Pago, Nubank), Tesouro, FIIs ou Ações da família.</p>
        <button class="btn btn-primary btn-sm" id="btn-empty-add-investment" style="margin-top: 12px;">
          <i data-lucide="plus"></i> <span>Cadastrar Primeiro Investimento</span>
        </button>
      </div>
    `;

    document.getElementById('btn-empty-add-investment')?.addEventListener('click', () => {
      openNewInvestmentModal();
    });

    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = investments.map(inv => {
    const amount = Number(inv.currentAmount) || 0;
    const rate = Number(inv.annualYield) || 0;
    const monthlyDep = Number(inv.monthlyDeposit) || 0;
    const personEmoji = inv.person === 'Ju' ? '👩' : (inv.person === 'Ozi' ? '👩' : '👥');

    let typeBadgeColor = 'bg-primary-soft text-primary';
    if (inv.type === 'renda_fixa') typeBadgeColor = 'bg-success-soft text-success';
    if (inv.type === 'fii') typeBadgeColor = 'bg-warning-soft text-warning';
    if (inv.type === 'acoes') typeBadgeColor = 'bg-info-soft text-info';

    return `
      <div class="investment-item-card">
        <div class="inv-left">
          <div class="inv-badge-type ${typeBadgeColor}">
            <i data-lucide="${inv.icon || 'trending-up'}"></i>
          </div>
          <div class="inv-info">
            <strong>${inv.name}</strong>
            <span class="text-muted" style="font-size: 0.78rem;">
              ${inv.institution || 'Banco'} • ${personEmoji} ${inv.person || 'Ambos'} • <span class="text-success font-bold font-mono">${rate.toFixed(1)}% a.a.</span>
            </span>
          </div>
        </div>
        <div class="inv-right">
          <div class="inv-values-group">
            <span class="font-mono font-bold text-success font-16">${formatCurrency(amount)}</span>
            ${monthlyDep > 0 ? `<span class="text-muted" style="font-size: 0.72rem;">+ ${formatCurrency(monthlyDep)}/mês</span>` : ''}
          </div>
          <div class="inv-action-btns">
            <button class="btn-icon-tiny btn-deposit-inv" data-id="${inv.id}" title="Fazer Aporte">
              <i data-lucide="plus-circle"></i>
            </button>
            <button class="btn-icon-tiny btn-del-inv" data-id="${inv.id}" title="Excluir Investimento">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Listeners para Aporte e Exclusão
  container.querySelectorAll('.btn-deposit-inv').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const inv = state.investments.find(i => i.id === id);
      if (!inv) return;

      const amountStr = prompt(`Informe o valor do novo aporte em "${inv.name}" (R$):`, '100.00');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        inv.currentAmount = (Number(inv.currentAmount) || 0) + amount;
        showToast(`Aporte de ${formatCurrency(amount)} adicionado com sucesso!`, 'success');
        onStateChange();
      }
    });
  });

  container.querySelectorAll('.btn-del-inv').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Deseja realmente remover este investimento da carteira?')) {
        state.investments = state.investments.filter(i => i.id !== id);
        showToast('Investimento removido.', 'warning');
        onStateChange();
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Inicialização dos Sliders e Simulação
 */
export function initSimulationSliders(state) {
  const sliderDeposit = document.getElementById('proj-slider-deposit');
  const sliderRate = document.getElementById('proj-slider-rate');
  const sliderMonths = document.getElementById('proj-slider-months');

  const valDeposit = document.getElementById('proj-val-deposit');
  const valRate = document.getElementById('proj-val-rate');
  const valMonths = document.getElementById('proj-val-months');

  if (!sliderDeposit || !sliderRate || !sliderMonths) return;

  function updateSimulation() {
    const monthlyDeposit = parseFloat(sliderDeposit.value) || 0;
    const annualRate = parseFloat(sliderRate.value) || 0;
    const totalMonths = parseInt(sliderMonths.value, 10) || 0;

    if (valDeposit) valDeposit.textContent = formatCurrency(monthlyDeposit);
    if (valRate) valRate.textContent = `${annualRate.toFixed(1)}% a.a.`;
    if (valMonths) valMonths.textContent = `${totalMonths} meses (${(totalMonths / 12).toFixed(1)} anos)`;

    calculateAndRenderProjection(monthlyDeposit, annualRate, totalMonths, state);
  }

  sliderDeposit.addEventListener('input', updateSimulation);
  sliderRate.addEventListener('input', updateSimulation);
  sliderMonths.addEventListener('input', updateSimulation);

  updateSimulation();
}

export function calculateAndRenderProjection(monthlyDeposit, annualRate, totalMonths, state) {
  if (typeof document === 'undefined') return;

  // Soma de investimentos reais cadastrados + saldos
  const investmentsTotal = (state.investments || []).reduce((sum, inv) => sum + (Number(inv.currentAmount) || 0), 0);
  const initialCapital = Math.max(0, investmentsTotal);
  const monthlyRate = annualRate > 0 ? Math.pow(1 + (annualRate / 100), 1 / 12) - 1 : 0;

  if (totalMonths === 0 && initialCapital === 0 && monthlyDeposit === 0) {
    const kpiFinalTotal = document.getElementById('proj-kpi-final-total');
    const kpiTotalInvested = document.getElementById('proj-kpi-total-invested');
    const kpiTotalInterest = document.getElementById('proj-kpi-total-interest');

    if (kpiFinalTotal) kpiFinalTotal.textContent = 'R$ 0,00';
    if (kpiTotalInvested) kpiTotalInvested.textContent = 'R$ 0,00';
    if (kpiTotalInterest) kpiTotalInterest.textContent = 'R$ 0,00';

    renderProjectionChart(['Mês 0'], [0], [0]);
    return;
  }

  const labels = [];
  const totalAccumulatedData = [];
  const investedCapitalData = [];

  const effectiveMonths = Math.max(1, totalMonths);
  const stepSize = Math.max(1, Math.floor(effectiveMonths / 12));

  for (let m = 0; m <= effectiveMonths; m += stepSize) {
    let acc = initialCapital;
    let inv = initialCapital;

    for (let step = 1; step <= m; step++) {
      acc = (acc + monthlyDeposit) * (1 + monthlyRate);
      inv += monthlyDeposit;
    }

    labels.push(`Mês ${m}`);
    totalAccumulatedData.push(Math.round(acc));
    investedCapitalData.push(Math.round(inv));
  }

  // Valores finais
  let finalAccumulated = initialCapital;
  let finalInvested = initialCapital;
  for (let step = 1; step <= effectiveMonths; step++) {
    finalAccumulated = (finalAccumulated + monthlyDeposit) * (1 + monthlyRate);
    finalInvested += monthlyDeposit;
  }
  const finalInterest = Math.max(0, finalAccumulated - finalInvested);

  // Atualizar KPIs
  const kpiFinalTotal = document.getElementById('proj-kpi-final-total');
  const kpiTotalInvested = document.getElementById('proj-kpi-total-invested');
  const kpiTotalInterest = document.getElementById('proj-kpi-total-interest');

  if (kpiFinalTotal) kpiFinalTotal.textContent = formatCurrency(finalAccumulated);
  if (kpiTotalInvested) kpiTotalInvested.textContent = formatCurrency(finalInvested);
  if (kpiTotalInterest) kpiTotalInterest.textContent = formatCurrency(finalInterest);

  renderProjectionChart(labels, totalAccumulatedData, investedCapitalData);
}

function renderProjectionChart(labels, totalData, investedData) {
  const canvas = document.getElementById('projectionChart');
  if (!canvas || !window.Chart) return;

  if (projectionChartInstance) {
    projectionChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');

  const gradientTotal = ctx.createLinearGradient(0, 0, 0, 300);
  gradientTotal.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
  gradientTotal.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  const gradientInvested = ctx.createLinearGradient(0, 0, 0, 300);
  gradientInvested.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
  gradientInvested.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

  projectionChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Patrimônio Total com Juros (R$)',
          data: totalData,
          borderColor: '#10b981',
          backgroundColor: gradientTotal,
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#10b981'
        },
        {
          label: 'Valor Aportado do Bolso (R$)',
          data: investedData,
          borderColor: '#6366f1',
          backgroundColor: gradientInvested,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 2
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
          labels: {
            color: '#94a3b8',
            font: { family: 'Plus Jakarta Sans', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#64748b',
            callback: (val) => 'R$ ' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
          }
        }
      }
    }
  });
}

function initInvestmentFormListeners(state, onStateChange) {
  const form = document.getElementById('form-new-investment');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('inv-name').value.trim();
    const institution = document.getElementById('inv-institution').value.trim();
    const type = document.getElementById('inv-type').value;
    const currentAmount = parseFloat(document.getElementById('inv-amount').value);
    const monthlyDeposit = parseFloat(document.getElementById('inv-monthly-deposit').value) || 0;
    const annualYield = parseFloat(document.getElementById('inv-annual-yield').value);
    const person = document.getElementById('inv-person').value;

    if (!name || isNaN(currentAmount) || currentAmount < 0 || isNaN(annualYield)) {
      showToast('Preencha os campos obrigatórios do investimento.', 'error');
      return;
    }

    if (!state.investments) state.investments = [];

    state.investments.push({
      id: generateId('inv'),
      name,
      institution,
      type,
      currentAmount,
      monthlyDeposit,
      annualYield,
      person,
      icon: type === 'renda_fixa' ? 'shield-check' : (type === 'fii' ? 'building' : 'trending-up')
    });

    form.reset();
    const modal = document.getElementById('modal-investment');
    if (modal) modal.classList.remove('active');

    showToast(`Investimento "${name}" cadastrado com sucesso!`, 'success');
    onStateChange();
  });
}

export function openNewInvestmentModal() {
  const modal = document.getElementById('modal-investment');
  const form = document.getElementById('form-new-investment');
  if (form) form.reset();
  if (modal) modal.classList.add('active');
}
