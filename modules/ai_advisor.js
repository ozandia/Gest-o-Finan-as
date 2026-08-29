/**
 * Gestão Financeira - Módulo do Consultor IA & Chat Financeiro da Família Martins
 * Análise de dados em linguagem natural, insights preditivos e perguntas rápidas
 */

import { formatCurrency, formatDate } from './utils.js';

export function initAIAdvisor(state, onStateChange) {
  const chatMessages = document.getElementById('ai-chat-messages');
  const chatInput = document.getElementById('ai-chat-input');
  const btnSend = document.getElementById('btn-send-ai-chat');
  const chipButtons = document.querySelectorAll('.ai-suggest-chip');

  if (!chatMessages || !chatInput || !btnSend) return;

  // Enviar mensagem pelo botão
  btnSend.addEventListener('click', () => {
    sendMessage();
  });

  // Enviar pelo Enter
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Chips de perguntas rápidas
  chipButtons.forEach(chip => {
    chip.addEventListener('click', () => {
      const question = chip.getAttribute('data-question') || chip.textContent.trim();
      chatInput.value = question;
      sendMessage();
    });
  });

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Adicionar mensagem do usuário
    appendMessage('user', text);
    chatInput.value = '';

    // Efeito de digitação da IA
    const typingId = showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator(typingId);
      const responseHtml = processAIQuery(text, state);
      appendMessage('ai', responseHtml);
    }, 600);
  }

  function appendMessage(sender, content) {
    const isUser = sender === 'user';
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-chat-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`;

    if (isUser) {
      msgDiv.innerHTML = `
        <div class="bubble-content">
          <p>${escapeHtml(content)}</p>
        </div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="bubble-avatar">
          <i data-lucide="sparkles"></i>
        </div>
        <div class="bubble-content">
          <div class="bot-header">
            <strong>Consultor IA Martins</strong>
            <span class="bot-time">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="bot-body">${content}</div>
        </div>
      `;
    }

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (window.lucide) window.lucide.createIcons();
  }

  function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'ai-chat-bubble bot-bubble typing-bubble';
    typingDiv.innerHTML = `
      <div class="bubble-avatar"><i data-lucide="sparkles"></i></div>
      <div class="bubble-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (window.lucide) window.lucide.createIcons();
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}

/**
 * Processador Inteligente de Perguntas Financeiras em Linguagem Natural
 */
export function processAIQuery(query, state) {
  const text = query.toLowerCase().trim();
  const { transactions, categories, accounts, budgets, goals } = state;
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const accMap = Object.fromEntries(accounts.map(a => [a.id, a]));

  const paidTxs = transactions.filter(t => t.status === 'paid');
  const totalIncome = paidTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpense = paidTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  // 1. DIÁRIAS E SALÁRIOS DE JU E OZI
  if (text.includes('diária') || text.includes('diaria') || text.includes('diárias')) {
    const juDiarias = paidTxs.filter(t => t.categoryId === 'cat_diaria_ju' || (t.person === 'Ju' && t.desc.toLowerCase().includes('diária')));
    const oziDiarias = paidTxs.filter(t => t.categoryId === 'cat_diaria_ozi' || (t.person === 'Ozi' && t.desc.toLowerCase().includes('diária')));
    
    const juSum = juDiarias.reduce((s, t) => s + Number(t.amount || 0), 0);
    const oziSum = oziDiarias.reduce((s, t) => s + Number(t.amount || 0), 0);

    return `
      <p>Aqui está o levantamento de <strong>Diárias de Trabalho</strong>:</p>
      <ul class="ai-response-list">
        <li>👩 <strong>Ju:</strong> <strong>${juDiarias.length}</strong> diária(s) somando <span class="text-success font-bold font-mono">${formatCurrency(juSum)}</span></li>
        <li>👩 <strong>Ozi:</strong> <strong>${oziDiarias.length}</strong> diária(s) somando <span class="text-success font-bold font-mono">${formatCurrency(oziSum)}</span></li>
      </ul>
      <p>Total em diárias do casal: <strong class="text-success font-mono">${formatCurrency(juSum + oziSum)}</strong></p>
    `;
  }

  // 2. RESUMO GERAL / SALDO / FLUXO
  if (text.includes('resumo') || text.includes('saldo') || text.includes('quanto temos') || text.includes('geral') || text.includes('panorama')) {
    const juIncome = paidTxs.filter(t => t.type === 'income' && t.person === 'Ju').reduce((s, t) => s + Number(t.amount || 0), 0);
    const oziIncome = paidTxs.filter(t => t.type === 'income' && t.person === 'Ozi').reduce((s, t) => s + Number(t.amount || 0), 0);

    return `
      <p>📊 <strong>Resumo Financeiro da Família Martins:</strong></p>
      <div class="ai-kpi-pill-grid">
        <div class="ai-kpi-pill"><span class="label">Receitas</span><span class="val text-success">${formatCurrency(totalIncome)}</span></div>
        <div class="ai-kpi-pill"><span class="label">Despesas</span><span class="val text-danger">${formatCurrency(totalExpense)}</span></div>
        <div class="ai-kpi-pill"><span class="label">Saldo Líquido</span><span class="val ${balance >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(balance)}</span></div>
      </div>
      <p style="margin-top: 8px;"><strong>Receitas por Pessoa:</strong> Ju: <span class="text-primary font-mono">${formatCurrency(juIncome)}</span> | Ozi: <span class="text-info font-mono">${formatCurrency(oziIncome)}</span></p>
    `;
  }

  // 3. GASTOS POR BANCO / CONTA (C6, Mercado Pago, Nubank)
  if (text.includes('c6') || text.includes('mercado pago') || text.includes('nubank') || text.includes('conta') || text.includes('cartão') || text.includes('cartao')) {
    const c6Exp = paidTxs.filter(t => t.type === 'expense' && t.accountId === 'acc_c6').reduce((s, t) => s + Number(t.amount || 0), 0);
    const mpExp = paidTxs.filter(t => t.type === 'expense' && t.accountId === 'acc_mercadopago').reduce((s, t) => s + Number(t.amount || 0), 0);
    const nuExp = paidTxs.filter(t => t.type === 'expense' && t.accountId === 'acc_nubank').reduce((s, t) => s + Number(t.amount || 0), 0);

    return `
      <p>💳 <strong>Despesas Registradas por Conta / Cartão:</strong></p>
      <ul class="ai-response-list">
        <li>⬛ <strong>C6 Bank:</strong> <span class="font-mono text-danger font-bold">${formatCurrency(c6Exp)}</span></li>
        <li>🟦 <strong>Mercado Pago:</strong> <span class="font-mono text-danger font-bold">${formatCurrency(mpExp)}</span></li>
        <li>🟪 <strong>Nubank:</strong> <span class="font-mono text-danger font-bold">${formatCurrency(nuExp)}</span></li>
      </ul>
    `;
  }

  // 4. METAS E COFRES
  if (text.includes('meta') || text.includes('sonho') || text.includes('reserva') || text.includes('viagem') || text.includes('guardar')) {
    if (goals.length === 0) {
      return `<p>🎯 Nenhuma meta financeira cadastrada no momento. Você pode criar objetivos como <em>Reserva de Emergência</em> ou <em>Viagem de Férias</em> na aba <strong>Metas & Sonhos</strong>!</p>`;
    }
    const goalsHtml = goals.map(g => {
      const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100));
      return `<li><strong>${g.name}:</strong> ${pct}% concluído (<span class="font-mono text-success">${formatCurrency(g.current || 0)}</span> de ${formatCurrency(g.target || 0)})</li>`;
    }).join('');

    return `
      <p>🎯 <strong>Status das Metas da Família Martins:</strong></p>
      <ul class="ai-response-list">${goalsHtml}</ul>
    `;
  }

  // 5. MAIORES GASTOS / CATEGORIAS
  if (text.includes('maior gasto') || text.includes('alimentação') || text.includes('mercado') || text.includes('gastamos mais') || text.includes('onde foi')) {
    const expenseTxs = paidTxs.filter(t => t.type === 'expense');
    if (expenseTxs.length === 0) {
      return `<p>Não há despesas registradas no momento para analisar o ranking de gastos.</p>`;
    }

    const catTotals = {};
    expenseTxs.forEach(t => {
      catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + Number(t.amount || 0);
    });

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCatsHtml = sortedCats.slice(0, 3).map(([catId, amount], i) => {
      const name = catMap[catId]?.name || 'Outros';
      return `<li>${i + 1}º <strong>${name}:</strong> <span class="font-mono text-danger font-bold">${formatCurrency(amount)}</span></li>`;
    }).join('');

    return `
      <p>🛒 <strong>Categorias com maiores despesas:</strong></p>
      <ul class="ai-response-list">${topCatsHtml}</ul>
    `;
  }

  // Resposta padrão analítica inteligente
  return `
    <p>Entendido! Posso ajudar com análises detalhadas das finanças de <strong>Ju & Ozi</strong>. Experimente me perguntar:</p>
    <div class="ai-inline-chips">
      <button class="ai-mini-chip" onclick="document.getElementById('ai-chat-input').value='Resumo de diárias';document.getElementById('btn-send-ai-chat').click();">💵 Diárias de Ju & Ozi</button>
      <button class="ai-mini-chip" onclick="document.getElementById('ai-chat-input').value='Gastos no cartão C6 e Nubank';document.getElementById('btn-send-ai-chat').click();">💳 Gastos por Cartão</button>
      <button class="ai-mini-chip" onclick="document.getElementById('ai-chat-input').value='Resumo financeiro geral';document.getElementById('btn-send-ai-chat').click();">📊 Panorama Geral</button>
      <button class="ai-mini-chip" onclick="document.getElementById('ai-chat-input').value='Status das Metas';document.getElementById('btn-send-ai-chat').click();">🎯 Nossas Metas</button>
    </div>
  `;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
