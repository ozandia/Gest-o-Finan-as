/**
 * Gestão Financeira - Módulo de Gerenciamento de Transações (CRUD, Filtros, Paginação)
 */

import { formatCurrency, formatDate, generateId, showToast } from './utils.js';
import { AVATARS } from './avatars.js';

let currentPage = 1;
const ITEMS_PER_PAGE = 10;

export function renderTransactionsTable(state, onStateChange, onEditTx) {
  const tbody = document.getElementById('transactions-table-body');
  const showingCount = document.getElementById('tx-showing-count');
  const totalCount = document.getElementById('tx-total-count');
  const filteredSum = document.getElementById('tx-filtered-sum');
  const paginationContainer = document.getElementById('tx-pagination');

  if (!tbody) return;

  const { transactions, categories, accounts } = state;
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const accMap = Object.fromEntries(accounts.map(a => [a.id, a]));

  // Obter valores dos filtros
  const searchTerm = (document.getElementById('tx-search-input')?.value || '').toLowerCase().trim();
  const filterPerson = document.getElementById('tx-filter-person')?.value || 'all';
  const filterType = document.getElementById('tx-filter-type')?.value || 'all';
  const filterCategory = document.getElementById('tx-filter-category')?.value || 'all';
  const filterAccount = document.getElementById('tx-filter-account')?.value || 'all';
  const filterPaymentMethod = document.getElementById('tx-filter-payment-method')?.value || 'all';
  const filterStatus = document.getElementById('tx-filter-status')?.value || 'all';

  // Aplicar filtros
  let filtered = transactions.filter(tx => {
    // Filtro de Responsável (Ju / Ozi / Ambos)
    if (filterPerson !== 'all') {
      const txPerson = tx.person || 'Ambos';
      if (txPerson !== filterPerson) return false;
    }

    // Busca por texto
    if (searchTerm) {
      const matchDesc = (tx.desc || '').toLowerCase().includes(searchTerm);
      const matchAmount = tx.amount.toString().includes(searchTerm);
      const catName = (catMap[tx.categoryId]?.name || '').toLowerCase();
      const subcatName = (tx.subcategory || '').toLowerCase();
      const matchCat = catName.includes(searchTerm) || subcatName.includes(searchTerm);
      const matchPerson = (tx.person || '').toLowerCase().includes(searchTerm);
      if (!matchDesc && !matchAmount && !matchCat && !matchPerson) return false;
    }

    // Tipo
    if (filterType !== 'all' && tx.type !== filterType) return false;

    // Categoria
    if (filterCategory !== 'all' && tx.categoryId !== filterCategory) return false;

    // Conta
    if (filterAccount !== 'all' && tx.accountId !== filterAccount) return false;

    // Forma de Pagamento (PIX, Débito, Crédito, etc.)
    if (filterPaymentMethod !== 'all') {
      const txPay = tx.paymentMethod || 'pix';
      if (txPay !== filterPaymentMethod) return false;
    }

    // Status
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;

    return true;
  });

  // Ordenar por data decrescente
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Atualizar contadores
  if (totalCount) totalCount.textContent = transactions.length;
  if (showingCount) showingCount.textContent = filtered.length;

  const totalSum = filtered.reduce((acc, t) => {
    if (t.type === 'income') return acc + Number(t.amount);
    if (t.type === 'expense') return acc - Number(t.amount);
    return acc;
  }, 0);

  if (filteredSum) {
    filteredSum.textContent = (totalSum >= 0 ? '+' : '') + formatCurrency(totalSum);
    filteredSum.className = `money-value font-mono font-semibold ${totalSum >= 0 ? 'text-success' : 'text-danger'}`;
  }

  // Paginação
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (paginatedItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted" style="padding: 40px;">
          <i data-lucide="inbox" style="width: 36px; height: 36px; margin-bottom: 8px;"></i>
          <p>Nenhuma transação encontrada com os filtros selecionados.</p>
        </td>
      </tr>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = paginatedItems.map(tx => {
    const cat = catMap[tx.categoryId] || { name: 'Geral', color: '#6366f1', icon: 'tag' };
    const acc = accMap[tx.accountId] || { name: 'Conta Padrão', color: '#6366f1' };
    
    let typeIcon = 'arrow-up-right';
    let typeClass = 'text-danger';
    let sign = '-';

    if (tx.type === 'income') {
      typeIcon = 'arrow-down-left';
      typeClass = 'text-success';
      sign = '+';
    } else if (tx.type === 'transfer') {
      typeIcon = 'arrow-left-right';
      typeClass = 'text-primary';
      sign = '';
    }

    const isPaid = tx.status === 'paid';
    const person = tx.person || 'Ambos';
    const personKey = person.toLowerCase() === 'ju' ? 'ju' : (person.toLowerCase() === 'ozi' ? 'ozi' : 'ambos');
    const personEmoji = personKey === 'ju' ? '👩🏻' : (personKey === 'ozi' ? '👩🏽‍🦱' : '👥');

    const paymentMethod = tx.paymentMethod || (tx.type === 'transfer' ? 'transfer' : 'pix');
    const paymentMap = {
      pix: { label: '⚡ PIX', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
      debit: { label: '💳 Débito', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
      credit: { label: '💳 Crédito', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
      cash: { label: '💵 Dinheiro', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
      transfer: { label: '🏦 TED / Transf.', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
      boleto: { label: '📄 Boleto', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.12)' }
    };
    const payInfo = paymentMap[paymentMethod] || paymentMap.pix;

    return `
      <tr data-tx-id="${tx.id}">
        <td>
          <span class="tx-icon-circle ${typeClass}" style="background: var(--bg-input);">
            <i data-lucide="${typeIcon}"></i>
          </span>
        </td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <strong style="color: var(--text-main);">${tx.desc}</strong>
          </div>
        </td>
        <td>
          <span class="badge-person ${personKey}">
            <span class="table-avatar-icon">${AVATARS[personKey] || personEmoji}</span>
            <span>${person}</span>
          </span>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 2px; align-items: flex-start;">
            <span class="tag-badge" style="background: ${cat.color}22; color: ${cat.color};">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${cat.color};"></span>
              ${cat.name}
            </span>
            ${tx.subcategory ? `<span style="font-size: 0.72rem; color: var(--text-muted); padding-left: 2px; font-weight: 500;">↳ ${tx.subcategory}</span>` : ''}
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
            <span class="tag-badge" style="background: var(--bg-input); border: 1px solid var(--border-color);">
              <i data-lucide="credit-card" style="width: 12px; height: 12px;"></i>
              ${acc.name}
            </span>
            <span class="tag-badge" style="background: ${payInfo.bg}; color: ${payInfo.color}; font-size: 0.72rem; padding: 2px 7px; font-weight: 700; border-radius: 6px;">
              ${payInfo.label}
            </span>
          </div>
        </td>
        <td class="font-mono text-muted" style="font-size: 0.85rem;">
          ${formatDate(tx.date)}
        </td>
        <td>
          <button class="status-badge ${isPaid ? 'paid' : 'pending'}" data-action="toggle-status" data-id="${tx.id}" title="Clique para alterar status">
            <i data-lucide="${isPaid ? 'check' : 'clock'}" style="width: 12px; height: 12px;"></i>
            <span>${isPaid ? 'Pago' : 'Pendente'}</span>
          </button>
        </td>
        <td class="text-right font-mono font-bold ${typeClass}">
          ${sign} ${formatCurrency(tx.amount)}
        </td>
        <td class="text-center">
          <div style="display: flex; gap: 4px; justify-content: center;">
            <button class="btn-icon-tiny" data-action="edit-tx" data-id="${tx.id}" title="Editar">
              <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
            </button>
            <button class="btn-icon-tiny text-danger" data-action="delete-tx" data-id="${tx.id}" title="Excluir">
              <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Renderizar controles de paginação
  if (paginationContainer) {
    let pagHtml = '';
    if (totalPages > 1) {
      pagHtml += `
        <button class="btn-icon-tiny ${currentPage === 1 ? 'disabled' : ''}" id="btn-prev-page" ${currentPage === 1 ? 'disabled' : ''}>
          <i data-lucide="chevron-left"></i>
        </button>
        <span style="font-size: 0.85rem; padding: 4px 8px;">Página <strong>${currentPage}</strong> de ${totalPages}</span>
        <button class="btn-icon-tiny ${currentPage === totalPages ? 'disabled' : ''}" id="btn-next-page" ${currentPage === totalPages ? 'disabled' : ''}>
          <i data-lucide="chevron-right"></i>
        </button>
      `;
    }
    paginationContainer.innerHTML = pagHtml;

    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderTransactionsTable(state, onStateChange, onEditTx);
      }
    });

    document.getElementById('btn-next-page')?.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTransactionsTable(state, onStateChange, onEditTx);
      }
    });
  }

  // Event Listeners na tabela para ações de linha
  tbody.querySelectorAll('[data-action="toggle-status"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tx = state.transactions.find(t => t.id === id);
      if (tx) {
        tx.status = tx.status === 'paid' ? 'pending' : 'paid';
        onStateChange();
        showToast(`Status alterado para ${tx.status === 'paid' ? 'Pago' : 'Pendente'}.`, 'success');
      }
    });
  });

  tbody.querySelectorAll('[data-action="edit-tx"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const tx = state.transactions.find(t => t.id === id);
      if (tx && onEditTx) onEditTx(tx);
    });
  });

  tbody.querySelectorAll('[data-action="delete-tx"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Tem certeza que deseja excluir esta transação?')) {
        state.transactions = state.transactions.filter(t => t.id !== id);
        onStateChange();
        showToast('Transação excluída com sucesso.', 'info');
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

export function saveTransactionFromForm(formData, state, onStateChange) {
  const { id, type, person, desc, amount, categoryId, subcategory, accountId, destAccountId, date, status, paymentMethod, installments } = formData;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    showToast('Informe um valor válido maior que zero.', 'error');
    return false;
  }

  const cleanSubcat = type === 'transfer' ? null : (subcategory || null);
  const cleanPaymentMethod = type === 'transfer' ? 'transfer' : (paymentMethod || 'pix');

  const catObj = state.categories.find(c => c.id === categoryId);
  const defaultDesc = cleanSubcat || catObj?.name || (type === 'transfer' ? 'Transferência entre Contas' : 'Lançamento');
  const finalDesc = (desc && desc.trim()) ? desc.trim() : defaultDesc;

  if (id) {
    // Edição de transação existente
    const idx = state.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      state.transactions[idx] = {
        ...state.transactions[idx],
        type,
        person: person || 'Ambos',
        desc: finalDesc,
        amount: numAmount,
        categoryId: type === 'transfer' ? 'cat_other' : categoryId,
        subcategory: cleanSubcat,
        accountId,
        destAccountId: type === 'transfer' ? destAccountId : null,
        paymentMethod: cleanPaymentMethod,
        date,
        status
      };
      showToast('Transação atualizada com sucesso!', 'success');
    }
  } else {
    // Nova transação (com suporte a parcelamento no cartão de crédito)
    const numInstallments = (cleanPaymentMethod === 'credit' || !cleanPaymentMethod) ? (parseInt(installments, 10) || 1) : 1;

    if (numInstallments > 1 && type === 'expense') {
      const installmentAmount = +(numAmount / numInstallments).toFixed(2);
      const baseDate = new Date(date + 'T00:00:00');

      for (let i = 0; i < numInstallments; i++) {
        const instDate = new Date(baseDate);
        instDate.setMonth(instDate.getMonth() + i);

        const newTx = {
          id: generateId('tx'),
          type,
          person: person || 'Ambos',
          desc: `${finalDesc} (${i + 1}/${numInstallments})`,
          amount: installmentAmount,
          categoryId,
          subcategory: cleanSubcat,
          accountId,
          paymentMethod: 'credit',
          date: instDate.toISOString().split('T')[0],
          status: i === 0 ? status : 'pending' // primeira parcela segue status, demais pendentes
        };
        state.transactions.push(newTx);
      }
      showToast(`${numInstallments} parcelas de ${formatCurrency(installmentAmount)} geradas com sucesso!`, 'success');
    } else {
      const newTx = {
        id: generateId('tx'),
        type,
        person: person || 'Ambos',
        desc: finalDesc,
        amount: numAmount,
        categoryId: type === 'transfer' ? 'cat_other' : categoryId,
        subcategory: cleanSubcat,
        accountId,
        destAccountId: type === 'transfer' ? destAccountId : null,
        paymentMethod: cleanPaymentMethod,
        date,
        status
      };
      state.transactions.push(newTx);
      showToast('Transação cadastrada com sucesso!', 'success');
    }
  }

  onStateChange();
  return true;
}
