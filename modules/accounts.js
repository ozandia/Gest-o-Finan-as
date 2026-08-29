/**
 * FinFlow - Módulo de Gestão de Contas Bancárias e Cartões
 */

import { formatCurrency, showToast } from './utils.js';

export function calculateAccountBalances(state) {
  const { accounts, transactions } = state;
  const balances = {};

  accounts.forEach(acc => {
    balances[acc.id] = Number(acc.initialBalance || 0);
  });

  transactions.forEach(tx => {
    if (tx.status !== 'paid') return;

    const amount = Number(tx.amount || 0);

    if (tx.type === 'income') {
      if (balances[tx.accountId] !== undefined) {
        balances[tx.accountId] += amount;
      }
    } else if (tx.type === 'expense') {
      if (balances[tx.accountId] !== undefined) {
        balances[tx.accountId] -= amount;
      }
    } else if (tx.type === 'transfer') {
      if (balances[tx.accountId] !== undefined) {
        balances[tx.accountId] -= amount;
      }
      if (tx.destAccountId && balances[tx.destAccountId] !== undefined) {
        balances[tx.destAccountId] += amount;
      }
    }
  });

  return balances;
}

export function renderAccountsView(state, onStateChange, onEditAccount) {
  const container = document.getElementById('accounts-container');
  if (!container) return;

  const { accounts } = state;
  const balances = calculateAccountBalances(state);

  const accountTypeNames = {
    checking: 'Conta Corrente / Digital',
    savings: 'Conta Poupança',
    credit: 'Cartão de Crédito',
    cash: 'Dinheiro em Espécie',
    investment: 'Investimentos & Corretora'
  };

  const accountTypeIcons = {
    checking: 'wallet-cards',
    savings: 'piggy-bank',
    credit: 'credit-card',
    cash: 'banknote',
    investment: 'trending-up'
  };

  container.innerHTML = accounts.map(acc => {
    const balance = balances[acc.id] || 0;
    const isNegative = balance < 0;
    const typeLabel = accountTypeNames[acc.type] || 'Conta';
    const iconName = accountTypeIcons[acc.type] || 'wallet';

    return `
      <div class="account-card">
        <div class="account-card-accent-line" style="background: ${acc.color || '#6366f1'};"></div>
        
        <div class="account-card-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="tx-icon-circle" style="background: ${acc.color}22; color: ${acc.color};">
              <i data-lucide="${iconName}"></i>
            </div>
            <div>
              <div class="account-card-name">${acc.name}</div>
              <div class="account-card-type">${typeLabel}</div>
            </div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="btn-icon-tiny" data-action="edit-account" data-id="${acc.id}" title="Editar Conta">
              <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="btn-icon-tiny text-danger" data-action="delete-account" data-id="${acc.id}" title="Excluir">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <span class="account-balance-title">Saldo Disponível</span>
          <div class="account-balance-amount money-value ${isNegative ? 'text-danger' : 'text-main'}">
            ${formatCurrency(balance)}
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-action="edit-account"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const acc = state.accounts.find(a => a.id === id);
      if (acc && onEditAccount) onEditAccount(acc);
    });
  });

  container.querySelectorAll('[data-action="delete-account"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (state.accounts.length <= 1) {
        showToast('Você deve manter ao menos uma conta cadastrada.', 'warning');
        return;
      }
      if (confirm('Tem certeza que deseja excluir esta conta? As transações associadas serão mantidas.')) {
        state.accounts = state.accounts.filter(a => a.id !== id);
        onStateChange();
        showToast('Conta excluída com sucesso.', 'info');
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}
