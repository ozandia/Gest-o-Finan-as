/**
 * Gestão Financeira - Módulo de Contas Recorrentes & Calendário Visual de Vencimentos
 */

import { formatCurrency, formatDate, generateId, showToast } from './utils.js';

let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let selectedDay = new Date().getDate();

export function initRecurringCalendar(state, onStateChange) {
  renderCalendar(state, onStateChange);
  initRecurringForm(state, onStateChange);
}

export function renderCalendar(state, onStateChange) {
  const calendarGrid = document.getElementById('calendar-days-grid');
  const monthTitle = document.getElementById('calendar-month-year-title');
  const selectedDayDetails = document.getElementById('calendar-day-details');
  const btnPrev = document.getElementById('btn-cal-prev-month');
  const btnNext = document.getElementById('btn-cal-next-month');
  const btnToday = document.getElementById('btn-cal-today');

  if (!calendarGrid) return;

  // Navegação de mês
  if (btnPrev && !btnPrev.dataset.bound) {
    btnPrev.dataset.bound = 'true';
    btnPrev.addEventListener('click', () => {
      currentCalendarMonth--;
      if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
      }
      renderCalendar(state, onStateChange);
    });
  }

  if (btnNext && !btnNext.dataset.bound) {
    btnNext.dataset.bound = 'true';
    btnNext.addEventListener('click', () => {
      currentCalendarMonth++;
      if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
      }
      renderCalendar(state, onStateChange);
    });
  }

  if (btnToday && !btnToday.dataset.bound) {
    btnToday.dataset.bound = 'true';
    btnToday.addEventListener('click', () => {
      const now = new Date();
      currentCalendarMonth = now.getMonth();
      currentCalendarYear = now.getFullYear();
      selectedDay = now.getDate();
      renderCalendar(state, onStateChange);
    });
  }

  // Título do Mês / Ano
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  if (monthTitle) {
    monthTitle.textContent = `${monthNames[currentCalendarMonth]} de ${currentCalendarYear}`;
  }

  // Dados de transações e contas recorrentes para o mês atual
  const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay(); // 0 (Dom) a 6 (Sáb)

  // Mapear eventos por dia
  const monthEventsMap = {};
  for (let d = 1; d <= daysInMonth; d++) {
    monthEventsMap[d] = [];
  }

  // Transações registradas no mês
  state.transactions.forEach(t => {
    if (!t.date) return;
    const [y, m, d] = t.date.split('-').map(Number);
    if (y === currentCalendarYear && m === (currentCalendarMonth + 1)) {
      if (monthEventsMap[d]) {
        monthEventsMap[d].push({
          type: t.type,
          desc: t.desc,
          amount: t.amount,
          status: t.status,
          person: t.person,
          accountId: t.accountId,
          rawTx: t
        });
      }
    }
  });

  // Contas Recorrentes cadastradas
  const recurring = state.recurring || [];
  recurring.forEach(rec => {
    const dueDay = Math.min(daysInMonth, parseInt(rec.dueDay, 10) || 1);
    // Verificar se já existe transação criada para essa conta recorrente neste mês
    const alreadyLogged = monthEventsMap[dueDay]?.some(e => e.desc === rec.desc);
    if (!alreadyLogged && monthEventsMap[dueDay]) {
      monthEventsMap[dueDay].push({
        type: rec.type,
        desc: rec.desc,
        amount: rec.amount,
        status: 'pending',
        person: rec.person,
        accountId: rec.accountId,
        isRecurringTemplate: true,
        recId: rec.id
      });
    }
  });

  // Construir HTML da Grade do Calendário
  let gridHtml = '';
  const now = new Date();
  const isCurrentRealMonth = now.getFullYear() === currentCalendarYear && now.getMonth() === currentCalendarMonth;
  const todayRealDay = now.getDate();

  // Dias em branco antes do dia 1
  for (let i = 0; i < firstDayIndex; i++) {
    gridHtml += `<div class="cal-day-cell cal-day-empty"></div>`;
  }

  // Dias do mês
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = isCurrentRealMonth && d === todayRealDay;
    const isSelected = d === selectedDay;
    const events = monthEventsMap[d] || [];
    const hasIncome = events.some(e => e.type === 'income');
    const hasExpense = events.some(e => e.type === 'expense');
    const hasPending = events.some(e => e.status === 'pending');

    let dotClasses = [];
    if (hasIncome) dotClasses.push('has-income');
    if (hasExpense) dotClasses.push('has-expense');
    if (hasPending) dotClasses.push('has-pending');

    gridHtml += `
      <div class="cal-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${events.length > 0 ? 'has-events' : ''}" data-day="${d}">
        <span class="cal-day-number">${d}</span>
        <div class="cal-day-dots">
          ${hasIncome ? '<span class="cal-dot income" title="Receita"></span>' : ''}
          ${hasExpense ? '<span class="cal-dot expense" title="Despesa"></span>' : ''}
        </div>
        ${events.length > 0 ? `<span class="cal-event-count-badge">${events.length}</span>` : ''}
      </div>
    `;
  }

  calendarGrid.innerHTML = gridHtml;

  // Event listener para seleção de dia
  calendarGrid.querySelectorAll('.cal-day-cell[data-day]').forEach(cell => {
    cell.addEventListener('click', () => {
      calendarGrid.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('is-selected'));
      cell.classList.add('is-selected');
      selectedDay = parseInt(cell.getAttribute('data-day'), 10);
      renderSelectedDayDetails(selectedDay, monthEventsMap[selectedDay] || [], state, onStateChange);
    });
  });

  // Renderizar detalhes do dia selecionado
  renderSelectedDayDetails(selectedDay, monthEventsMap[selectedDay] || [], state, onStateChange);

  // Renderizar lista de contas recorrentes
  renderRecurringList(state, onStateChange);

  if (window.lucide) window.lucide.createIcons();
}

function renderSelectedDayDetails(day, events, state, onStateChange) {
  const container = document.getElementById('calendar-day-details');
  if (!container) return;

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const formattedDateStr = `${String(day).padStart(2, '0')} de ${monthNames[currentCalendarMonth]}`;

  if (events.length === 0) {
    container.innerHTML = `
      <div class="day-details-header">
        <h4>📅 Vencimentos para ${formattedDateStr}</h4>
      </div>
      <div class="empty-state-box" style="padding: 24px 16px; text-align: center;">
        <i data-lucide="calendar-check-2" class="text-muted" style="width: 36px; height: 36px; margin-bottom: 8px;"></i>
        <p class="text-muted" style="font-size: 0.88rem;">Nenhum lançamento ou vencimento programado para este dia.</p>
        <button class="btn btn-outline btn-sm" id="btn-add-event-day" style="margin-top: 10px;">
          <i data-lucide="plus"></i> <span>Lançar Neste Dia</span>
        </button>
      </div>
    `;

    document.getElementById('btn-add-event-day')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-transaction');
      const dateInp = document.getElementById('tx-date');
      if (dateInp) {
        const monthStr = String(currentCalendarMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        dateInp.value = `${currentCalendarYear}-${monthStr}-${dayStr}`;
      }
      if (modal) modal.classList.add('active');
    });

    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const itemsHtml = events.map((e, idx) => {
    const isIncome = e.type === 'income';
    const isPaid = e.status === 'paid';
    const personEmoji = e.person === 'Ju' ? '👩' : (e.person === 'Ozi' ? '👩' : '👥');

    return `
      <div class="cal-event-card ${isIncome ? 'income-border' : 'expense-border'}">
        <div class="event-left">
          <div class="event-icon ${isIncome ? 'income' : 'expense'}">
            <i data-lucide="${isIncome ? 'arrow-down-left' : 'arrow-up-right'}"></i>
          </div>
          <div class="event-info">
            <strong>${e.desc}</strong>
            <span class="text-muted" style="font-size: 0.78rem;">${personEmoji} ${e.person || 'Ambos'} • ${isPaid ? '🟢 Concluído' : '🟡 A Vencer / Pendente'}</span>
          </div>
        </div>
        <div class="event-right">
          <span class="font-mono font-bold ${isIncome ? 'text-success' : 'text-danger'}">${isIncome ? '+' : '-'} ${formatCurrency(e.amount)}</span>
          ${!isPaid ? `
            <button class="btn btn-sm btn-success btn-settle-bill" data-event-idx="${idx}" title="Confirmar pagamento/recebimento">
              <i data-lucide="check"></i> <span>Pagar</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="day-details-header">
      <h4>📅 Lançamentos de ${formattedDateStr} (${events.length})</h4>
    </div>
    <div class="day-events-list">
      ${itemsHtml}
    </div>
  `;

  // Listener para botão "Pagar" / Quitar
  container.querySelectorAll('.btn-settle-bill').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-event-idx'), 10);
      const ev = events[idx];
      if (!ev) return;

      if (ev.rawTx) {
        ev.rawTx.status = 'paid';
      } else {
        // Criar transação a partir de modelo recorrente
        const monthStr = String(currentCalendarMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        state.transactions.push({
          id: generateId('tx'),
          type: ev.type,
          desc: ev.desc,
          amount: ev.amount,
          person: ev.person || 'Ambos',
          categoryId: ev.type === 'income' ? 'cat_salary_ju' : 'cat_housing',
          accountId: ev.accountId || 'acc_c6',
          date: `${currentCalendarYear}-${monthStr}-${dayStr}`,
          status: 'paid'
        });
      }

      showToast(`Conta "${ev.desc}" marcada como paga com sucesso!`, 'success');
      onStateChange();
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function renderRecurringList(state, onStateChange) {
  const container = document.getElementById('recurring-bills-list');
  if (!container) return;

  const recurring = state.recurring || [];
  if (recurring.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box" style="padding: 20px; text-align: center;">
        <p class="text-muted" style="font-size: 0.85rem;">Nenhuma conta fixa cadastrada (Aluguel, Salário, Internet).</p>
      </div>
    `;
    return;
  }

  container.innerHTML = recurring.map(rec => {
    const isIncome = rec.type === 'income';
    return `
      <div class="recurring-item-card">
        <div class="rec-info">
          <strong>${rec.desc}</strong>
          <span class="text-muted" style="font-size: 0.78rem;">Todo dia <strong>${rec.dueDay}</strong> • ${rec.person}</span>
        </div>
        <div class="rec-actions">
          <span class="font-mono font-bold ${isIncome ? 'text-success' : 'text-danger'}">${formatCurrency(rec.amount)}</span>
          <button class="btn-icon-tiny btn-del-recurring" data-id="${rec.id}" title="Excluir conta fixa">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-del-recurring').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      state.recurring = state.recurring.filter(r => r.id !== id);
      showToast('Conta fixa removida!', 'success');
      onStateChange();
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function initRecurringForm(state, onStateChange) {
  const form = document.getElementById('form-new-recurring');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('rec-desc').value.trim();
    const amount = parseFloat(document.getElementById('rec-amount').value);
    const type = document.getElementById('rec-type').value;
    const dueDay = parseInt(document.getElementById('rec-due-day').value, 10);
    const person = document.getElementById('rec-person').value;
    const accountId = document.getElementById('rec-account').value;

    if (!desc || isNaN(amount) || amount <= 0 || isNaN(dueDay)) {
      showToast('Preencha os campos obrigatórios corretamente.', 'error');
      return;
    }

    if (!state.recurring) state.recurring = [];

    state.recurring.push({
      id: generateId('rec'),
      desc,
      amount,
      type,
      dueDay,
      person,
      accountId
    });

    form.reset();
    showToast(`Conta fixa "${desc}" cadastrada com sucesso!`, 'success');
    onStateChange();
  });
}
