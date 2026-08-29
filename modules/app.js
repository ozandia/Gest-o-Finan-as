/**
 * Gestão Financeira - Aplicação Principal
 * Controle de Finanças Pessoal e Familiar (Ju & Ozi)
 * Orquestração de Estado, Rotas, Modais, KPIs e Eventos
 */

import { loadState, saveState, exportTransactionsCSV, exportBackupJSON, generateDemoTransactions, clearAllTransactions, DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS, DEFAULT_BUDGETS, DEFAULT_GOALS } from './storage.js';
import { formatCurrency, formatDate, generateId, filterTransactionsByPeriod, showToast } from './utils.js';
import { renderCashflowChart, renderCategoryChart } from './charts.js';
import { renderTransactionsTable, saveTransactionFromForm } from './transactions.js';
import { renderBudgetsView, renderDashboardBudgets } from './budgets.js';
import { renderGoalsView } from './goals.js';
import { renderAccountsView, calculateAccountBalances } from './accounts.js';
import { renderReportsView } from './reports.js';
import { AVATARS } from './avatars.js';
import { initSpreadsheetImport } from './import_spreadsheet.js';
import { initReceiptOCR } from './import_receipt.js';
import { initVoiceCommand } from './voice_input.js';
import { initAIAdvisor } from './ai_advisor.js';
import { initRecurringCalendar, renderCalendar } from './recurring_calendar.js';
import { initInstallments, renderInvoicesView } from './installments.js';
import { initProjections, renderInvestmentsList, openNewInvestmentModal } from './projections.js';
import { initCloudSync } from './cloud_sync.js';

// Estado Global da Aplicação
let appState = {
  transactions: [],
  categories: [],
  accounts: [],
  budgets: [],
  goals: []
};

let currentView = 'dashboard';
let currentCashflowRange = '6months';

// Cores disponíveis para contas
const ACCOUNT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  appState = loadState();

  initAvatars();
  initThemeAndPrivacy();
  initNavigation();
  initModals();
  initFormListeners();
  initGlobalShortcuts();
  initSpreadsheetImport(appState, () => refreshAllViews());
  initReceiptOCR(appState, () => refreshAllViews());
  initVoiceCommand(appState, () => refreshAllViews());
  initAIAdvisor(appState, () => refreshAllViews());
  initRecurringCalendar(appState, () => refreshAllViews());
  initInstallments(appState, () => refreshAllViews());
  initProjections(appState, () => refreshAllViews());
  populateCategoryAndAccountDropdowns();

  refreshAllViews();

  // Inicializar Sincronização em Nuvem (Vercel Postgres)
  initCloudSync(appState, () => {
    populateCategoryAndAccountDropdowns();
    refreshAllViews();
  });

  if (window.lucide) window.lucide.createIcons();
}

function initAvatars() {
  const boxJu = document.getElementById('avatar-box-ju');
  const boxOzi = document.getElementById('avatar-box-ozi');
  if (boxJu) boxJu.innerHTML = AVATARS.ju;
  if (boxOzi) boxOzi.innerHTML = AVATARS.ozi;

  const chipJu = document.getElementById('chip-avatar-ju');
  const chipOzi = document.getElementById('chip-avatar-ozi');
  const chipAmbos = document.getElementById('chip-avatar-ambos');
  if (chipJu) chipJu.innerHTML = AVATARS.ju;
  if (chipOzi) chipOzi.innerHTML = AVATARS.ozi;
  if (chipAmbos) chipAmbos.innerHTML = AVATARS.ambos;
}

/**
 * Atualiza todos os dados, componentes e gráficos da aplicação
 */
function refreshAllViews() {
  saveState(appState);

  updateKPICards();
  updateSidebarBalance();
  renderDashboardRecentTxs();
  renderDashboardBudgets(appState);

  const globalPeriod = document.getElementById('global-period-select')?.value || 'current-month';
  const periodTxs = filterTransactionsByPeriod(appState.transactions, globalPeriod);

  // Gráficos
  renderCashflowChart(appState.transactions, currentCashflowRange);
  renderCategoryChart(periodTxs, appState.categories);

  // Views específicas
  renderTransactionsTable(appState, refreshAllViews, openEditTransactionModal);
  renderBudgetsView(appState, refreshAllViews, openEditBudgetModal);
  renderGoalsView(appState, refreshAllViews, openEditGoalModal, openDepositGoalModal);
  renderAccountsView(appState, refreshAllViews, openEditAccountModal);
  renderReportsView(appState, globalPeriod);
  renderCalendar(appState, refreshAllViews);
  renderInvoicesView(appState, refreshAllViews);
  renderInvestmentsList(appState, refreshAllViews);

  // Atualizar badge de contagem de transações na sidebar
  const badgeTx = document.getElementById('badge-tx-count');
  if (badgeTx) badgeTx.textContent = appState.transactions.length;

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Cálculo e Atualização dos KPIs do Dashboard + Receitas Discriminadas (Ju & Ozi)
 */
function updateKPICards() {
  const globalPeriod = document.getElementById('global-period-select')?.value || 'current-month';
  const periodTxs = filterTransactionsByPeriod(appState.transactions, globalPeriod);

  // Saldo Total Consolidado de todas as contas
  const balances = calculateAccountBalances(appState);
  const totalBalance = Object.values(balances).reduce((sum, b) => sum + b, 0);

  const kpiTotalBalance = document.getElementById('kpi-total-balance');
  if (kpiTotalBalance) kpiTotalBalance.textContent = formatCurrency(totalBalance);

  // Receitas Pagas vs Pendentes no período
  const paidIncomeTxs = periodTxs.filter(t => t.type === 'income' && t.status === 'paid');
  const paidIncome = paidIncomeTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const pendingIncome = periodTxs
    .filter(t => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const kpiTotalIncome = document.getElementById('kpi-total-income');
  const kpiIncomePendingVal = document.getElementById('kpi-income-pending-val');
  if (kpiTotalIncome) kpiTotalIncome.textContent = formatCurrency(paidIncome);
  if (kpiIncomePendingVal) kpiIncomePendingVal.textContent = formatCurrency(pendingIncome);

  // Despesas Pagas vs Pendentes no período
  const paidExpense = periodTxs
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const pendingExpense = periodTxs
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const kpiTotalExpense = document.getElementById('kpi-total-expense');
  const kpiExpensePendingVal = document.getElementById('kpi-expense-pending-val');
  if (kpiTotalExpense) kpiTotalExpense.textContent = formatCurrency(paidExpense);
  if (kpiExpensePendingVal) kpiExpensePendingVal.textContent = formatCurrency(pendingExpense);

  // Taxa de Poupança & Economia Líquida
  const netSavings = paidIncome - paidExpense;
  const savingsRate = paidIncome > 0 ? Math.max(0, (netSavings / paidIncome) * 100).toFixed(0) : 0;

  const kpiSavingsRate = document.getElementById('kpi-savings-rate');
  const kpiNetSavings = document.getElementById('kpi-net-savings');
  if (kpiSavingsRate) kpiSavingsRate.textContent = `${savingsRate}%`;
  if (kpiNetSavings) {
    kpiNetSavings.textContent = (netSavings >= 0 ? '+' : '') + formatCurrency(netSavings);
    kpiNetSavings.className = `money-value ${netSavings >= 0 ? 'text-success' : 'text-danger'}`;
  }

  // Comparativo com mês anterior para trend indicator
  const now = new Date();
  const prevMonthTxs = appState.transactions.filter(t => {
    if (!t.date || t.status !== 'paid') return false;
    const [tY, tM] = t.date.split('-').map(Number);
    const prevM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return tY === prevM.getFullYear() && (tM - 1) === prevM.getMonth();
  });

  const prevNet = prevMonthTxs.reduce((sum, t) => {
    if (t.type === 'income') return sum + Number(t.amount);
    if (t.type === 'expense') return sum - Number(t.amount);
    return sum;
  }, 0);

  const trendEl = document.getElementById('kpi-balance-trend');
  if (trendEl) {
    const diff = netSavings - prevNet;
    const isPositive = diff >= 0;
    trendEl.innerHTML = `
      <span class="trend-indicator ${isPositive ? 'positive' : 'negative'}">
        <i data-lucide="${isPositive ? 'trending-up' : 'trending-down'}"></i>
        ${isPositive ? '+' : ''}${formatCurrency(diff)}
      </span>
      <span class="trend-text">vs mês anterior</span>
    `;
  }

  // ==========================================
  // DISCRIMINAÇÃO DAS RECEITAS: JU & OZI
  // ==========================================
  // Receitas de Ju
  const juIncomeTxs = paidIncomeTxs.filter(t => t.person === 'Ju');
  const juTotal = juIncomeTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const juSalaryTxs = juIncomeTxs.filter(t => t.categoryId === 'cat_salary_ju' || t.desc.toLowerCase().includes('salário') || t.desc.toLowerCase().includes('salario'));
  const juSalary = juSalaryTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const juDiariasTxs = juIncomeTxs.filter(t => t.categoryId === 'cat_diaria_ju' || t.desc.toLowerCase().includes('diária') || t.desc.toLowerCase().includes('diaria'));
  const juDiarias = juDiariasTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const elJuTotal = document.getElementById('ju-total-revenue');
  const elJuSalary = document.getElementById('ju-salary-val');
  const elJuDiarias = document.getElementById('ju-diarias-val');
  const elJuDiariasCount = document.getElementById('ju-diarias-count');

  if (elJuTotal) elJuTotal.textContent = formatCurrency(juTotal);
  if (elJuSalary) elJuSalary.textContent = formatCurrency(juSalary);
  if (elJuDiarias) elJuDiarias.textContent = formatCurrency(juDiarias);
  if (elJuDiariasCount) elJuDiariasCount.textContent = juDiariasTxs.length;

  // Receitas de Ozi
  const oziIncomeTxs = paidIncomeTxs.filter(t => t.person === 'Ozi');
  const oziTotal = oziIncomeTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const oziSalaryTxs = oziIncomeTxs.filter(t => t.categoryId === 'cat_salary_ozi' || t.desc.toLowerCase().includes('salário') || t.desc.toLowerCase().includes('salario'));
  const oziSalary = oziSalaryTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const oziDiariasTxs = oziIncomeTxs.filter(t => t.categoryId === 'cat_diaria_ozi' || t.desc.toLowerCase().includes('diária') || t.desc.toLowerCase().includes('diaria'));
  const oziDiarias = oziDiariasTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const elOziTotal = document.getElementById('ozi-total-revenue');
  const elOziSalary = document.getElementById('ozi-salary-val');
  const elOziDiarias = document.getElementById('ozi-diarias-val');
  const elOziDiariasCount = document.getElementById('ozi-diarias-count');

  if (elOziTotal) elOziTotal.textContent = formatCurrency(oziTotal);
  if (elOziSalary) elOziSalary.textContent = formatCurrency(oziSalary);
  if (elOziDiarias) elOziDiarias.textContent = formatCurrency(oziDiarias);
  if (elOziDiariasCount) elOziDiariasCount.textContent = oziDiariasTxs.length;
}

/**
 * Atualiza saldo no rodapé da Sidebar
 */
function updateSidebarBalance() {
  const balances = calculateAccountBalances(appState);
  const totalBalance = Object.values(balances).reduce((sum, b) => sum + b, 0);
  const sidebarTotal = document.getElementById('sidebar-total-balance');
  if (sidebarTotal) sidebarTotal.textContent = formatCurrency(totalBalance);
}

/**
 * Renderiza lista compacta de últimas transações no Dashboard
 */
function renderDashboardRecentTxs() {
  const container = document.getElementById('dashboard-recent-txs');
  if (!container) return;

  const sorted = [...appState.transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = `<p class="text-muted text-center" style="padding: 20px;">Nenhuma transação recente.</p>`;
    return;
  }

  const catMap = Object.fromEntries(appState.categories.map(c => [c.id, c]));
  const accMap = Object.fromEntries(appState.accounts.map(a => [a.id, a]));

  container.innerHTML = sorted.map(tx => {
    const cat = catMap[tx.categoryId] || { name: 'Geral', color: '#6366f1' };
    const acc = accMap[tx.accountId] || { name: 'Conta' };
    const isIncome = tx.type === 'income';
    const person = tx.person || 'Ambos';
    const personEmoji = person === 'Ju' ? '👩🏻' : (person === 'Ozi' ? '👩🏽‍🦱' : '👥');

    return `
      <div class="tx-compact-item">
        <div class="tx-compact-left">
          <div class="tx-icon-circle ${isIncome ? 'text-success' : 'text-danger'}" style="background: var(--bg-input);">
            <i data-lucide="${isIncome ? 'arrow-down-left' : 'arrow-up-right'}"></i>
          </div>
          <div class="tx-compact-info">
            <span class="tx-compact-title">${tx.desc}</span>
            <span class="tx-compact-meta">${formatDate(tx.date)} • ${personEmoji} ${person} • ${acc.name} • ${cat.name}</span>
          </div>
        </div>
        <div class="tx-compact-amount ${isIncome ? 'text-success' : 'text-danger'}">
          ${isIncome ? '+' : '-'} ${formatCurrency(tx.amount)}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Atualiza o dropdown de subcategorias com base na categoria selecionada
 */
export function updateSubcategoryDropdown(catSelectId, subcatSelectId, selectedSubcat = '') {
  const catSelect = document.getElementById(catSelectId);
  const subcatSelect = document.getElementById(subcatSelectId);
  if (!catSelect || !subcatSelect) return;

  const currentCatId = catSelect.value;
  const category = appState.categories.find(c => c.id === currentCatId);
  const subcategories = category && Array.isArray(category.subcategories) ? category.subcategories : [];

  if (subcategories.length === 0) {
    subcatSelect.innerHTML = '<option value="">Geral / Sem subcategoria</option>';
  } else {
    subcatSelect.innerHTML = `
      <option value="">-- Selecione uma subcategoria --</option>
      ${subcategories.map(sub => `<option value="${sub}" ${sub === selectedSubcat ? 'selected' : ''}>${sub}</option>`).join('')}
    `;
    if (selectedSubcat && subcategories.includes(selectedSubcat)) {
      subcatSelect.value = selectedSubcat;
    }
  }
}

/**
 * Preenche Dropdowns de Categorias e Contas em Filtros e Formulários
 */
function populateCategoryAndAccountDropdowns() {
  // Dropdown Categoria no Modal de Transação
  const modalCatSelect = document.getElementById('tx-category');
  const filterCatSelect = document.getElementById('tx-filter-category');
  const budgetCatSelect = document.getElementById('budget-category');
  const instCatSelect = document.getElementById('inst-category');

  if (modalCatSelect) {
    modalCatSelect.innerHTML = appState.categories.map(c => `
      <option value="${c.id}">${c.name}</option>
    `).join('');
    updateSubcategoryDropdown('tx-category', 'tx-subcategory');
  }

  if (filterCatSelect) {
    filterCatSelect.innerHTML = `
      <option value="all">Todas as Categorias</option>
      ${appState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
    `;
  }

  if (budgetCatSelect) {
    const expenseCats = appState.categories.filter(c => c.type === 'expense');
    budgetCatSelect.innerHTML = expenseCats.map(c => `
      <option value="${c.id}">${c.name}</option>
    `).join('');
  }

  if (instCatSelect) {
    const expenseCats = appState.categories.filter(c => c.type === 'expense');
    instCatSelect.innerHTML = expenseCats.map(c => `
      <option value="${c.id}">${c.name}</option>
    `).join('');
    updateSubcategoryDropdown('inst-category', 'inst-subcategory');
  }

  // Dropdown Contas
  const modalAccSelect = document.getElementById('tx-account');
  const modalDestAccSelect = document.getElementById('tx-destination-account');
  const filterAccSelect = document.getElementById('tx-filter-account');
  const depositAccSelect = document.getElementById('deposit-account');
  const importAccSelect = document.getElementById('import-default-account');
  const receiptAccSelect = document.getElementById('receipt-extracted-account');

  const accOptionsHtml = appState.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

  if (modalAccSelect) modalAccSelect.innerHTML = accOptionsHtml;
  if (modalDestAccSelect) modalDestAccSelect.innerHTML = accOptionsHtml;
  if (depositAccSelect) depositAccSelect.innerHTML = accOptionsHtml;
  if (importAccSelect) importAccSelect.innerHTML = accOptionsHtml;
  if (receiptAccSelect) receiptAccSelect.innerHTML = accOptionsHtml;

  if (filterAccSelect) {
    filterAccSelect.innerHTML = `
      <option value="all">Todas as Contas</option>
      ${accOptionsHtml}
    `;
  }

  // Seletor de Paleta de Cores para Contas
  const colorPalette = document.getElementById('account-color-palette');
  const inputColor = document.getElementById('account-color');
  if (colorPalette && inputColor) {
    colorPalette.innerHTML = ACCOUNT_COLORS.map((color, idx) => `
      <span class="color-option ${idx === 0 ? 'active' : ''}" style="background-color: ${color};" data-color="${color}"></span>
    `).join('');

    colorPalette.querySelectorAll('.color-option').forEach(dot => {
      dot.addEventListener('click', () => {
        colorPalette.querySelectorAll('.color-option').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        inputColor.value = dot.getAttribute('data-color');
      });
    });
  }
}

/**
 * Navegação e Troca de Views (Tabs)
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link[data-view]');
  const pageTitle = document.getElementById('current-page-title');
  const pageSubtitle = document.getElementById('current-page-subtitle');

  const viewTitles = {
    dashboard: { title: 'Visão Geral', sub: 'Acompanhe seu fluxo de caixa e finanças de Ju & Ozi em tempo real' },
    transactions: { title: 'Extrato & Transações', sub: 'Consulte, filtre e gerencie todas as receitas (salários, diárias) e despesas' },
    calendar: { title: 'Calendário & Contas Fixas', sub: 'Acompanhe os vencimentos de contas e programe despesas/receitas recorrentes' },
    invoices: { title: 'Faturas & Compras Parceladas', sub: 'Acompanhe a projeção dos cartões C6, Mercado Pago e Nubank' },
    'ai-advisor': { title: 'Consultor IA da Família Martins', sub: 'Inteligência artificial para análises, diárias e dicas financeiras' },
    projections: { title: 'Simulador de Liberdade Financeira', sub: 'Projete o crescimento patrimonial com aportes e juros compostos' },
    budgets: { title: 'Orçamentos Mensais', sub: 'Defina tetos de gastos para cada categoria e mantenha o controle' },
    goals: { title: 'Metas & Sonhos', sub: 'Poupe com propósito e acompanhe o crescimento dos seus cofres' },
    accounts: { title: 'Contas & Cartões', sub: 'Gerencie saldos bancários, carteiras e limites' },
    reports: { title: 'Relatórios & DRE', sub: 'Demonstrativo simplificado de desempenho financeiro da casa' }
  };

  const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-view]');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const sidebar = document.getElementById('sidebar');

  function switchView(viewName) {
    if (!viewTitles[viewName]) return;
    currentView = viewName;

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    bottomNavItems.forEach(bLink => {
      bLink.classList.toggle('active', bLink.getAttribute('data-view') === viewName);
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${viewName}`);
    if (targetSec) targetSec.classList.add('active');

    if (pageTitle) pageTitle.textContent = viewTitles[viewName].title;
    if (pageSubtitle) pageSubtitle.textContent = viewTitles[viewName].sub;

    // Fechar menu mobile se estiver aberto
    closeSidebarMobile();

    // Rolar para o topo suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });

    refreshAllViews();
  }

  function openSidebarMobile() {
    sidebar?.classList.add('open');
    sidebarBackdrop?.classList.add('active');
  }

  function closeSidebarMobile() {
    sidebar?.classList.remove('open');
    sidebarBackdrop?.classList.remove('active');
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');
      switchView(view);
    });
  });

  bottomNavItems.forEach(bLink => {
    bLink.addEventListener('click', (e) => {
      e.preventDefault();
      const view = bLink.getAttribute('data-view');
      switchView(view);
    });
  });

  // Botão Central de Lançamento na Bottom Bar
  document.getElementById('btn-bottom-new-tx')?.addEventListener('click', () => {
    openNewTransactionModal();
  });

  // Botão de Importar na Bottom Bar
  document.getElementById('btn-bottom-import')?.addEventListener('click', () => {
    populateCategoryAndAccountDropdowns();
    openModal(document.getElementById('modal-import'));
  });

  // Botão "Mais" na Bottom Bar abre o Drawer de Menu
  document.getElementById('btn-bottom-more')?.addEventListener('click', () => {
    openSidebarMobile();
  });

  // Botões de link dentro de cards
  document.querySelectorAll('[data-view-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-view-target');
      switchView(target);
    });
  });

  // Seletor de Período Global
  document.getElementById('global-period-select')?.addEventListener('change', () => {
    refreshAllViews();
  });

  // Segmented control para gráfico de fluxo de caixa (6 meses / 12 meses)
  document.querySelectorAll('#cashflow-granularity .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#cashflow-granularity .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCashflowRange = btn.getAttribute('data-range');
      renderCashflowChart(appState.transactions, currentCashflowRange);
    });
  });

  // Toggle da Sidebar Mobile
  document.getElementById('btn-toggle-sidebar')?.addEventListener('click', openSidebarMobile);
  document.getElementById('btn-close-sidebar')?.addEventListener('click', closeSidebarMobile);
  sidebarBackdrop?.addEventListener('click', closeSidebarMobile);
}

/**
 * Modais & Formulários
 */
function initModals() {
  // Modal Transação
  const modalTx = document.getElementById('modal-transaction');
  document.getElementById('btn-new-transaction')?.addEventListener('click', () => {
    openNewTransactionModal();
  });
  document.getElementById('btn-close-tx-modal')?.addEventListener('click', () => closeModal(modalTx));
  document.getElementById('btn-cancel-tx')?.addEventListener('click', () => closeModal(modalTx));

  // Modal Meta
  const modalGoal = document.getElementById('modal-goal');
  document.getElementById('btn-new-goal')?.addEventListener('click', () => {
    document.getElementById('form-goal').reset();
    document.getElementById('goal-id').value = '';
    document.getElementById('modal-goal-title').textContent = 'Nova Meta Financeira';
    openModal(modalGoal);
  });
  document.getElementById('btn-close-goal-modal')?.addEventListener('click', () => closeModal(modalGoal));
  document.getElementById('btn-cancel-goal')?.addEventListener('click', () => closeModal(modalGoal));

  // Modal Aporte Meta
  const modalDeposit = document.getElementById('modal-deposit-goal');
  document.getElementById('btn-close-deposit-modal')?.addEventListener('click', () => closeModal(modalDeposit));
  document.getElementById('btn-cancel-deposit')?.addEventListener('click', () => closeModal(modalDeposit));

  // Modal Orçamento
  const modalBudget = document.getElementById('modal-budget');
  document.getElementById('btn-new-budget')?.addEventListener('click', () => {
    document.getElementById('form-budget').reset();
    document.getElementById('budget-id').value = '';
    document.getElementById('modal-budget-title').textContent = 'Configurar Orçamento';
    openModal(modalBudget);
  });
  document.getElementById('btn-close-budget-modal')?.addEventListener('click', () => closeModal(modalBudget));
  document.getElementById('btn-cancel-budget')?.addEventListener('click', () => closeModal(modalBudget));

  // Modal Conta
  const modalAccount = document.getElementById('modal-account');
  document.getElementById('btn-new-account')?.addEventListener('click', () => {
    document.getElementById('form-account').reset();
    document.getElementById('account-id').value = '';
    document.getElementById('modal-account-title').textContent = 'Nova Conta / Cartão';
    openModal(modalAccount);
  });
  document.getElementById('btn-close-account-modal')?.addEventListener('click', () => closeModal(modalAccount));
  document.getElementById('btn-cancel-account')?.addEventListener('click', () => closeModal(modalAccount));

  // Modal Configurações & Backup
  const modalSettings = document.getElementById('modal-settings');
  document.getElementById('btn-open-settings')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(modalSettings);
  });
  document.getElementById('btn-close-settings-modal')?.addEventListener('click', () => closeModal(modalSettings));

  // Modal Conta Fixa Recorrente
  const modalRecurring = document.getElementById('modal-recurring');
  document.getElementById('btn-open-new-recurring')?.addEventListener('click', () => {
    document.getElementById('form-new-recurring')?.reset();
    openModal(modalRecurring);
  });
  document.getElementById('btn-close-recurring-modal')?.addEventListener('click', () => closeModal(modalRecurring));
  document.getElementById('btn-cancel-recurring')?.addEventListener('click', () => closeModal(modalRecurring));

  // Modal Compra Parcelada
  const modalInstallment = document.getElementById('modal-installment');
  document.getElementById('btn-open-new-installment')?.addEventListener('click', () => {
    document.getElementById('form-new-installment')?.reset();
    const dateInput = document.getElementById('inst-first-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    openModal(modalInstallment);
  });
  document.getElementById('btn-close-installment-modal')?.addEventListener('click', () => closeModal(modalInstallment));
  document.getElementById('btn-cancel-installment')?.addEventListener('click', () => closeModal(modalInstallment));

  // Modal Novo Investimento
  const modalInvestment = document.getElementById('modal-investment');
  document.getElementById('btn-open-new-investment')?.addEventListener('click', () => {
    openNewInvestmentModal();
  });
  document.getElementById('btn-close-investment-modal')?.addEventListener('click', () => closeModal(modalInvestment));
  document.getElementById('btn-cancel-investment')?.addEventListener('click', () => closeModal(modalInvestment));

  // Modal Central de Importação (Planilhas & Prints)
  const modalImport = document.getElementById('modal-import');
  document.getElementById('btn-open-import')?.addEventListener('click', () => {
    populateCategoryAndAccountDropdowns();
    openModal(modalImport);
  });
  document.getElementById('btn-open-import-tx')?.addEventListener('click', () => {
    populateCategoryAndAccountDropdowns();
    openModal(modalImport);
  });
  document.getElementById('btn-close-import-modal')?.addEventListener('click', () => closeModal(modalImport));

  // Alternância de Abas no Modal de Importação
  document.querySelectorAll('.import-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      document.querySelectorAll('.import-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.import-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(tabId)?.classList.add('active');
    });
  });

  // Fechar ao clicar fora no backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop);
    });
  });
}

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('active');
  modalEl.setAttribute('aria-hidden', 'false');
  if (window.lucide) window.lucide.createIcons();
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('active');
  modalEl.setAttribute('aria-hidden', 'true');
}

/**
 * Abertura e Edição de Modais Específicos
 */
function openNewTransactionModal() {
  const form = document.getElementById('form-transaction');
  form.reset();
  document.getElementById('tx-id').value = '';
  document.getElementById('modal-tx-title').textContent = 'Nova Transação';
  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];

  // Set default type to expense
  setTypeTab('expense');
  setPersonChip('Ambos');
  updateSubcategoryDropdown('tx-category', 'tx-subcategory');
  openModal(document.getElementById('modal-transaction'));
}

function openEditTransactionModal(tx) {
  const form = document.getElementById('form-transaction');
  form.reset();
  document.getElementById('tx-id').value = tx.id;
  document.getElementById('modal-tx-title').textContent = 'Editar Transação';
  document.getElementById('tx-amount').value = tx.amount;
  document.getElementById('tx-desc').value = tx.desc;
  document.getElementById('tx-date').value = tx.date;
  document.getElementById('tx-status').value = tx.status || 'paid';
  document.getElementById('tx-account').value = tx.accountId;

  setTypeTab(tx.type);
  setPersonChip(tx.person || 'Ambos');

  if (tx.type !== 'transfer') {
    document.getElementById('tx-category').value = tx.categoryId;
    updateSubcategoryDropdown('tx-category', 'tx-subcategory', tx.subcategory || '');
  } else if (tx.destAccountId) {
    document.getElementById('tx-destination-account').value = tx.destAccountId;
  }

  // Desativar parcelas na edição
  const groupInst = document.getElementById('group-tx-installments');
  if (groupInst) groupInst.classList.add('hidden');

  openModal(document.getElementById('modal-transaction'));
}

function openEditBudgetModal(budget) {
  document.getElementById('budget-id').value = budget.id;
  document.getElementById('budget-category').value = budget.categoryId;
  document.getElementById('budget-limit').value = budget.limit;
  document.getElementById('modal-budget-title').textContent = 'Editar Orçamento';
  openModal(document.getElementById('modal-budget'));
}

function openEditGoalModal(goal) {
  document.getElementById('goal-id').value = goal.id;
  document.getElementById('goal-name').value = goal.name;
  document.getElementById('goal-target').value = goal.target;
  document.getElementById('goal-current').value = goal.current || 0;
  document.getElementById('goal-deadline').value = goal.deadline;
  document.getElementById('goal-icon').value = goal.icon || 'shield-check';
  document.getElementById('modal-goal-title').textContent = 'Editar Meta Financeira';
  openModal(document.getElementById('modal-goal'));
}

function openDepositGoalModal(goal) {
  document.getElementById('deposit-goal-id').value = goal.id;
  document.getElementById('deposit-goal-subtitle').textContent = `Meta: ${goal.name}`;
  document.getElementById('deposit-amount').value = '';
  openModal(document.getElementById('modal-deposit-goal'));
}

function openEditAccountModal(account) {
  document.getElementById('account-id').value = account.id;
  document.getElementById('account-name').value = account.name;
  document.getElementById('account-type').value = account.type;
  document.getElementById('account-balance').value = account.initialBalance || 0;
  document.getElementById('account-color').value = account.color || '#6366f1';
  document.getElementById('modal-account-title').textContent = 'Editar Conta';

  // Selecionar cor na paleta
  const palette = document.getElementById('account-color-palette');
  if (palette) {
    palette.querySelectorAll('.color-option').forEach(d => {
      d.classList.toggle('active', d.getAttribute('data-color') === account.color);
    });
  }

  openModal(document.getElementById('modal-account'));
}

function setTypeTab(type) {
  const tabs = document.querySelectorAll('.type-tab');
  tabs.forEach(tab => {
    const radio = tab.querySelector('input');
    const isSelected = radio.value === type;
    radio.checked = isSelected;
    tab.classList.toggle('active', isSelected);
  });

  const isTransfer = type === 'transfer';
  const groupCategory = document.getElementById('group-tx-category');
  const groupSubcategory = document.getElementById('group-tx-subcategory');
  const groupDestination = document.getElementById('group-tx-destination');
  const groupInstallments = document.getElementById('group-tx-installments');
  const labelAccount = document.getElementById('label-tx-account');

  if (isTransfer) {
    groupCategory?.classList.add('hidden');
    groupSubcategory?.classList.add('hidden');
    groupDestination?.classList.remove('hidden');
    groupInstallments?.classList.add('hidden');
    if (labelAccount) labelAccount.textContent = 'Conta Origem (Saída)';
  } else {
    groupCategory?.classList.remove('hidden');
    groupSubcategory?.classList.remove('hidden');
    groupDestination?.classList.add('hidden');
    groupInstallments?.classList.remove('hidden');
    if (labelAccount) labelAccount.textContent = 'Conta / Cartão';

    // Filtrar categorias correspondentes ao tipo
    const catSelect = document.getElementById('tx-category');
    if (catSelect) {
      const filteredCats = appState.categories.filter(c => c.type === type || c.type === 'both');
      const prevVal = catSelect.value;
      catSelect.innerHTML = filteredCats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      if (filteredCats.some(c => c.id === prevVal)) {
        catSelect.value = prevVal;
      }
      updateSubcategoryDropdown('tx-category', 'tx-subcategory');
    }
  }
}

function setPersonChip(person) {
  const chips = document.querySelectorAll('.member-chip');
  chips.forEach(chip => {
    const radio = chip.querySelector('input');
    const isSelected = radio.value === person;
    radio.checked = isSelected;
    chip.classList.toggle('active', isSelected);
  });
}

/**
 * Event Listeners de Formulários
 */
function initFormListeners() {
  // Tabs do seletor de tipo no modal de transação
  document.querySelectorAll('.type-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const radio = tab.querySelector('input');
      if (radio) setTypeTab(radio.value);
    });
  });

  // Listener de mudança de categoria no modal de transação
  document.getElementById('tx-category')?.addEventListener('change', () => {
    updateSubcategoryDropdown('tx-category', 'tx-subcategory');
  });

  // Listener de mudança de categoria no modal de compra parcelada
  document.getElementById('inst-category')?.addEventListener('change', () => {
    updateSubcategoryDropdown('inst-category', 'inst-subcategory');
  });

  // Chips do seletor de responsável (Ju, Ozi, Ambos)
  document.querySelectorAll('.member-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const radio = chip.querySelector('input');
      if (radio) setPersonChip(radio.value);
    });
  });

  // Submit Transação
  document.getElementById('form-transaction')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="tx-type"]:checked')?.value || 'expense';
    const person = document.querySelector('input[name="tx-person"]:checked')?.value || 'Ambos';
    
    const formData = {
      id: document.getElementById('tx-id').value,
      type,
      person,
      amount: document.getElementById('tx-amount').value,
      desc: document.getElementById('tx-desc').value,
      categoryId: document.getElementById('tx-category').value,
      subcategory: document.getElementById('tx-subcategory')?.value || '',
      accountId: document.getElementById('tx-account').value,
      destAccountId: document.getElementById('tx-destination-account').value,
      date: document.getElementById('tx-date').value,
      status: document.getElementById('tx-status').value,
      installments: document.getElementById('tx-installments')?.value || '1'
    };

    const success = saveTransactionFromForm(formData, appState, refreshAllViews);
    if (success) {
      closeModal(document.getElementById('modal-transaction'));
    }
  });

  // Submit Meta
  document.getElementById('form-goal')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('goal-id').value;
    const name = document.getElementById('goal-name').value;
    const target = parseFloat(document.getElementById('goal-target').value);
    const current = parseFloat(document.getElementById('goal-current').value) || 0;
    const deadline = document.getElementById('goal-deadline').value;
    const icon = document.getElementById('goal-icon').value;

    if (id) {
      const g = appState.goals.find(item => item.id === id);
      if (g) {
        g.name = name;
        g.target = target;
        g.current = current;
        g.deadline = deadline;
        g.icon = icon;
        showToast('Meta atualizada!', 'success');
      }
    } else {
      appState.goals.push({
        id: generateId('goal'),
        name,
        target,
        current,
        deadline,
        icon,
        color: '#10b981'
      });
      showToast('Meta criada com sucesso!', 'success');
    }

    refreshAllViews();
    closeModal(document.getElementById('modal-goal'));
  });

  // Submit Aporte em Meta
  document.getElementById('form-deposit-goal')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const goalId = document.getElementById('deposit-goal-id').value;
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const accountId = document.getElementById('deposit-account').value;

    if (isNaN(amount) || amount <= 0) {
      showToast('Informe um valor de aporte válido.', 'error');
      return;
    }

    const goal = appState.goals.find(g => g.id === goalId);
    if (goal) {
      goal.current = (Number(goal.current) || 0) + amount;

      // Criar transação de despesa/poupança na conta selecionada
      appState.transactions.push({
        id: generateId('tx'),
        type: 'expense',
        person: 'Ambos',
        desc: `Aporte na Meta: ${goal.name}`,
        amount,
        categoryId: 'cat_invest',
        accountId,
        date: new Date().toISOString().split('T')[0],
        status: 'paid'
      });

      showToast(`Aporte de ${formatCurrency(amount)} realizado com sucesso!`, 'success');
      refreshAllViews();
      closeModal(document.getElementById('modal-deposit-goal'));
    }
  });

  // Submit Orçamento
  document.getElementById('form-budget')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('budget-id').value;
    const categoryId = document.getElementById('budget-category').value;
    const limit = parseFloat(document.getElementById('budget-limit').value);

    if (id) {
      const b = appState.budgets.find(item => item.id === id);
      if (b) {
        b.categoryId = categoryId;
        b.limit = limit;
        showToast('Orçamento atualizado!', 'success');
      }
    } else {
      const existing = appState.budgets.find(b => b.categoryId === categoryId);
      if (existing) {
        existing.limit = limit;
        showToast('Orçamento da categoria atualizado!', 'success');
      } else {
        appState.budgets.push({
          id: generateId('bud'),
          categoryId,
          limit
        });
        showToast('Orçamento cadastrado com sucesso!', 'success');
      }
    }

    refreshAllViews();
    closeModal(document.getElementById('modal-budget'));
  });

  // Submit Conta
  document.getElementById('form-account')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('account-id').value;
    const name = document.getElementById('account-name').value;
    const type = document.getElementById('account-type').value;
    const initialBalance = parseFloat(document.getElementById('account-balance').value) || 0;
    const color = document.getElementById('account-color').value || '#6366f1';

    if (id) {
      const acc = appState.accounts.find(a => a.id === id);
      if (acc) {
        acc.name = name;
        acc.type = type;
        acc.initialBalance = initialBalance;
        acc.color = color;
        showToast('Conta atualizada com sucesso!', 'success');
      }
    } else {
      appState.accounts.push({
        id: generateId('acc'),
        name,
        type,
        initialBalance,
        color
      });
      showToast('Nova conta cadastrada!', 'success');
    }

    populateCategoryAndAccountDropdowns();
    refreshAllViews();
    closeModal(document.getElementById('modal-account'));
  });

  // Filtros da Tabela de Transações
  ['tx-search-input', 'tx-filter-person', 'tx-filter-type', 'tx-filter-category', 'tx-filter-account', 'tx-filter-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        const clearBtn = document.getElementById('btn-clear-tx-search');
        if (id === 'tx-search-input' && clearBtn) {
          clearBtn.classList.toggle('hidden', !el.value);
        }
        renderTransactionsTable(appState, refreshAllViews, openEditTransactionModal);
      });
      el.addEventListener('change', () => {
        renderTransactionsTable(appState, refreshAllViews, openEditTransactionModal);
      });
    }
  });

  document.getElementById('btn-clear-tx-search')?.addEventListener('click', () => {
    const input = document.getElementById('tx-search-input');
    if (input) input.value = '';
    document.getElementById('btn-clear-tx-search')?.classList.add('hidden');
    renderTransactionsTable(appState, refreshAllViews, openEditTransactionModal);
  });

  // Exportar CSV
  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    exportTransactionsCSV(appState.transactions, appState.categories, appState.accounts);
    showToast('Download do extrato CSV iniciado!', 'success');
  });

  // Exportar Backup JSON
  document.getElementById('btn-export-backup')?.addEventListener('click', () => {
    exportBackupJSON(appState);
    showToast('Download do backup JSON concluído!', 'success');
  });

  // Importar Backup JSON
  document.getElementById('input-import-backup')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.transactions && Array.isArray(imported.transactions)) {
          appState = {
            transactions: imported.transactions,
            categories: imported.categories || DEFAULT_CATEGORIES,
            accounts: imported.accounts || DEFAULT_ACCOUNTS,
            budgets: imported.budgets || DEFAULT_BUDGETS,
            goals: imported.goals || DEFAULT_GOALS
          };
          saveState(appState);
          populateCategoryAndAccountDropdowns();
          refreshAllViews();
          closeModal(document.getElementById('modal-settings'));
          showToast('Backup restaurado com sucesso!', 'success');
        } else {
          showToast('Arquivo de backup inválido.', 'error');
        }
      } catch (err) {
        showToast('Erro ao ler arquivo de backup.', 'error');
      }
    };
    reader.readAsText(file);
  });

  // Carregar Dados Demo
  document.getElementById('btn-load-demo-data')?.addEventListener('click', () => {
    if (confirm('Deseja recarregar os dados de demonstração de Ju & Ozi? Seus dados atuais serão substituídos.')) {
      appState = {
        transactions: generateDemoTransactions(),
        categories: DEFAULT_CATEGORIES,
        accounts: DEFAULT_ACCOUNTS,
        budgets: DEFAULT_BUDGETS,
        goals: DEFAULT_GOALS
      };
      saveState(appState);
      populateCategoryAndAccountDropdowns();
      refreshAllViews();
      closeModal(document.getElementById('modal-settings'));
      showToast('Dados de demonstração carregados com sucesso!', 'success');
    }
  });

  // Limpar Apenas Transações
  function handleClearTransactions() {
    if (confirm('Deseja realmente apagar todos os lançamentos de transações cadastrados? Suas contas e metas continuarão salvas.')) {
      appState.transactions = clearAllTransactions();
      saveState(appState);
      refreshAllViews();
      const modalSettings = document.getElementById('modal-settings');
      if (modalSettings) closeModal(modalSettings);
      showToast('Todas as transações foram apagadas com sucesso!', 'success');
    }
  }

  document.getElementById('btn-clear-all-txs')?.addEventListener('click', handleClearTransactions);
  document.getElementById('btn-clear-tx-settings')?.addEventListener('click', handleClearTransactions);

  // Zerar Todos os Dados
  document.getElementById('btn-wipe-data')?.addEventListener('click', () => {
    if (confirm('ATENÇÃO: Deseja apagar todas as transações, metas e contas salvas? Esta ação não pode ser desfeita.')) {
      appState = {
        transactions: [],
        categories: DEFAULT_CATEGORIES,
        accounts: DEFAULT_ACCOUNTS,
        budgets: [],
        goals: []
      };
      saveState(appState);
      populateCategoryAndAccountDropdowns();
      refreshAllViews();
      closeModal(document.getElementById('modal-settings'));
      showToast('Todos os dados foram resetados.', 'warning');
    }
  });
}

/**
 * Tema Claro/Escuro & Modo de Privacidade
 */
function initThemeAndPrivacy() {
  const savedTheme = localStorage.getItem('gestao_fin_theme_v2') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('gestao_fin_theme_v2', next);
    
    // Atualizar gráficos para o novo contraste
    renderCashflowChart(appState.transactions, currentCashflowRange);
    const globalPeriod = document.getElementById('global-period-select')?.value || 'current-month';
    renderCategoryChart(filterTransactionsByPeriod(appState.transactions, globalPeriod), appState.categories);
  });

  const isPrivacyActive = localStorage.getItem('gestao_fin_privacy_v2') === 'true';
  if (isPrivacyActive) {
    document.body.classList.add('hide-money');
    updateEyeIcon(true);
  }

  document.getElementById('btn-toggle-visibility')?.addEventListener('click', () => {
    const active = document.body.classList.toggle('hide-money');
    localStorage.setItem('gestao_fin_privacy_v2', active);
    updateEyeIcon(active);
    showToast(active ? 'Valores ocultados por privacidade.' : 'Valores visíveis.', 'info', 2000);
  });
}

function updateEyeIcon(isHidden) {
  const icon = document.getElementById('eye-icon');
  if (icon) {
    icon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
    if (window.lucide) window.lucide.createIcons();
  }
}

/**
 * Atalhos Globais de Teclado
 */
function initGlobalShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Tecla N para nova transação (se não estiver digitando em um input)
    if ((e.key === 'n' || e.key === 'N') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openNewTransactionModal();
    }

    // Tecla Escape para fechar modais
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(modal => {
        closeModal(modal);
      });
    }
  });
}

