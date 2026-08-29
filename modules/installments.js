/**
 * Gestão Financeira - Módulo de Compras Parceladas & Projeção de Faturas de Cartão
 */

import { formatCurrency, formatDate, generateId, showToast } from './utils.js';

export function initInstallments(state, onStateChange) {
  renderInvoicesView(state, onStateChange);
  initInstallmentModalListeners(state, onStateChange);
}

/**
 * Cria compras parceladas gerando N transações futuras
 */
export function createInstallmentPurchase(data, state) {
  const { desc, totalAmount, count, firstDate, accountId, categoryId, subcategory, person } = data;
  const numInstallments = parseInt(count, 10) || 1;
  const installmentVal = parseFloat((totalAmount / numInstallments).toFixed(2));
  const installmentGroupId = generateId('inst_group');

  const startDate = new Date(firstDate || new Date());

  for (let i = 1; i <= numInstallments; i++) {
    const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + (i - 1), startDate.getDate());
    const dateStr = dueDate.toISOString().split('T')[0];

    state.transactions.push({
      id: generateId('tx'),
      type: 'expense',
      desc: `${desc} (${i}/${numInstallments})`,
      amount: i === numInstallments ? parseFloat((totalAmount - (installmentVal * (numInstallments - 1))).toFixed(2)) : installmentVal,
      categoryId,
      subcategory: subcategory || null,
      accountId,
      date: dateStr,
      status: i === 1 ? 'paid' : 'pending',
      person: person || 'Ambos',
      installmentGroupId,
      installmentIndex: i,
      installmentTotal: numInstallments
    });
  }

  showToast(`Compra parcelada em ${numInstallments}x de ${formatCurrency(installmentVal)} cadastrada!`, 'success');
}

/**
 * Renderiza o Painel de Faturas e Parcelas Futuras
 */
export function renderInvoicesView(state, onStateChange) {
  const container = document.getElementById('invoices-projection-container');
  const activePlansContainer = document.getElementById('active-installments-list');
  const kpiCommittedLimit = document.getElementById('kpi-invoices-committed');
  const kpiNextMonthInvoice = document.getElementById('kpi-next-month-invoice');

  if (!container) return;

  const { transactions, accounts } = state;
  const cardAccounts = accounts.filter(a => a.id.includes('c6') || a.id.includes('nubank') || a.id.includes('mercado') || a.type === 'checking' || a.type === 'credit');

  // Calcular projeção de faturas para os próximos 6 meses
  const now = new Date();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const projectedMonths = [];

  for (let m = 0; m < 6; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const y = d.getFullYear();
    const monthIdx = d.getMonth();
    const monthLabel = `${monthNames[monthIdx]}/${y}`;

    // Somar gastos de cartão deste mês
    const monthTxs = transactions.filter(t => {
      if (t.type !== 'expense' || !t.date) return false;
      const [tY, tM] = t.date.split('-').map(Number);
      return tY === y && (tM - 1) === monthIdx;
    });

    const c6Total = monthTxs.filter(t => t.accountId === 'acc_c6').reduce((s, t) => s + Number(t.amount || 0), 0);
    const mpTotal = monthTxs.filter(t => t.accountId === 'acc_mercadopago').reduce((s, t) => s + Number(t.amount || 0), 0);
    const nuTotal = monthTxs.filter(t => t.accountId === 'acc_nubank').reduce((s, t) => s + Number(t.amount || 0), 0);
    const monthGrandTotal = c6Total + mpTotal + nuTotal;

    projectedMonths.push({
      monthLabel,
      isCurrent: m === 0,
      c6Total,
      mpTotal,
      nuTotal,
      monthGrandTotal,
      txCount: monthTxs.length
    });
  }

  // Atualizar KPIs de faturas
  const totalCommitted = projectedMonths.reduce((sum, p) => sum + p.monthGrandTotal, 0);
  if (kpiCommittedLimit) kpiCommittedLimit.textContent = formatCurrency(totalCommitted);
  if (kpiNextMonthInvoice && projectedMonths[1]) {
    kpiNextMonthInvoice.textContent = formatCurrency(projectedMonths[1].monthGrandTotal);
  }

  // Renderizar Cartões de Projeção Mês a Mês
  container.innerHTML = projectedMonths.map(p => `
    <div class="card invoice-month-card ${p.isCurrent ? 'current-month-border' : ''}">
      <div class="invoice-month-header">
        <div>
          <h4>${p.monthLabel}</h4>
          <span class="text-muted" style="font-size: 0.75rem;">${p.isCurrent ? '🟡 Fatura Atual' : '📅 Projeção Futura'}</span>
        </div>
        <span class="font-mono font-bold invoice-total-badge ${p.monthGrandTotal > 0 ? 'text-danger' : 'text-muted'}">
          ${formatCurrency(p.monthGrandTotal)}
        </span>
      </div>
      <div class="invoice-banks-breakdown">
        <div class="invoice-bank-row">
          <span>⬛ C6 Bank</span>
          <strong class="font-mono">${formatCurrency(p.c6Total)}</strong>
        </div>
        <div class="invoice-bank-row">
          <span>🟦 Mercado Pago</span>
          <strong class="font-mono">${formatCurrency(p.mpTotal)}</strong>
        </div>
        <div class="invoice-bank-row">
          <span>🟪 Nubank</span>
          <strong class="font-mono">${formatCurrency(p.nuTotal)}</strong>
        </div>
      </div>
    </div>
  `).join('');

  // Identificar Planos de Compras Parceladas Ativos
  if (activePlansContainer) {
    const installmentTxs = transactions.filter(t => t.installmentGroupId);
    const groupsMap = {};

    installmentTxs.forEach(t => {
      if (!groupsMap[t.installmentGroupId]) {
        groupsMap[t.installmentGroupId] = [];
      }
      groupsMap[t.installmentGroupId].push(t);
    });

    const groups = Object.values(groupsMap);
    if (groups.length === 0) {
      activePlansContainer.innerHTML = `
        <div class="empty-state-box" style="padding: 20px; text-align: center;">
          <p class="text-muted" style="font-size: 0.85rem;">Nenhuma compra parcelada ativa cadastrada.</p>
        </div>
      `;
    } else {
      activePlansContainer.innerHTML = groups.map(grp => {
        const first = grp[0];
        const total = grp.reduce((s, t) => s + Number(t.amount || 0), 0);
        const paidCount = grp.filter(t => t.status === 'paid').length;
        const totalCount = first.installmentTotal || grp.length;
        const cleanDesc = first.desc.replace(/\s*\(\d+\/\d+\)/, '');

        return `
          <div class="installment-plan-card">
            <div class="plan-header">
              <div>
                <strong>${cleanDesc}</strong>
                <span class="text-muted" style="font-size: 0.78rem;">${first.person || 'Ambos'} • ${first.accountId === 'acc_c6' ? 'C6 Bank' : (first.accountId === 'acc_nubank' ? 'Nubank' : 'Mercado Pago')}</span>
              </div>
              <span class="font-mono font-bold text-primary">${formatCurrency(total)}</span>
            </div>
            <div class="progress-track" style="margin: 8px 0 4px;">
              <div class="progress-bar safe" style="width: ${(paidCount / totalCount) * 100}%;"></div>
            </div>
            <div class="plan-footer" style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted);">
              <span>Parcela ${paidCount} de ${totalCount} pagas</span>
              <span>Restam ${formatCurrency(total - (first.amount * paidCount))}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

function initInstallmentModalListeners(state, onStateChange) {
  const form = document.getElementById('form-new-installment');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('inst-desc').value.trim();
    const totalAmount = parseFloat(document.getElementById('inst-total-amount').value);
    const count = parseInt(document.getElementById('inst-count').value, 10);
    const firstDate = document.getElementById('inst-first-date').value;
    const accountId = document.getElementById('inst-account').value;
    const categoryId = document.getElementById('inst-category').value;
    const subcategory = document.getElementById('inst-subcategory')?.value || '';
    const person = document.getElementById('inst-person').value;

    if (!desc || isNaN(totalAmount) || totalAmount <= 0 || isNaN(count) || count < 2) {
      showToast('Preencha os campos da compra parcelada corretamente.', 'error');
      return;
    }

    createInstallmentPurchase({
      desc,
      totalAmount,
      count,
      firstDate,
      accountId,
      categoryId,
      subcategory,
      person
    }, state);

    form.reset();
    const modal = document.getElementById('modal-installment');
    if (modal) modal.classList.remove('active');

    onStateChange();
  });
}
