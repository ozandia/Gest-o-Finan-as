/**
 * Gestão Financeira - Módulo de Armazenamento e Estado Inicial (Storage & Mock Data)
 */

export const STORAGE_KEYS = {
  TRANSACTIONS: 'gestao_fin_transactions_v3',
  CATEGORIES: 'gestao_fin_categories_v4',
  ACCOUNTS: 'gestao_fin_accounts_v3',
  BUDGETS: 'gestao_fin_budgets_v3',
  GOALS: 'gestao_fin_goals_v3',
  RECURRING: 'gestao_fin_recurring_v3',
  INVESTMENTS: 'gestao_fin_investments_v3',
  THEME: 'gestao_fin_theme_v2',
  PRIVACY: 'gestao_fin_privacy_v2'
};

// Membros / Responsáveis cadastrados
export const DEFAULT_MEMBERS = [
  { id: 'ju', name: 'Ju', color: '#ec4899', icon: 'user' },
  { id: 'ozi', name: 'Ozi', color: '#3b82f6', icon: 'user' },
  { id: 'ambos', name: 'Ambos / Casa', color: '#8b5cf6', icon: 'users' }
];

// Categorias Padrão com Subcategorias
export const DEFAULT_CATEGORIES = [
  // ==================== RECEITAS ====================
  // Receitas Ju
  { 
    id: 'cat_salary_ju', 
    name: 'Salário (Ju)', 
    type: 'income', 
    icon: 'briefcase', 
    color: '#ec4899', 
    essential: false, 
    member: 'Ju',
    subcategories: ['Salário Mensal', '13º Salário', 'Férias', 'Bônus']
  },
  { 
    id: 'cat_diaria_ju', 
    name: 'Diárias de Trabalho (Ju)', 
    type: 'income', 
    icon: 'calendar-check', 
    color: '#f43f5e', 
    essential: false, 
    member: 'Ju',
    subcategories: ['Diária', 'Plantão', 'Extra']
  },
  
  // Receitas Ozi
  { 
    id: 'cat_salary_ozi', 
    name: 'Salário (Ozi)', 
    type: 'income', 
    icon: 'briefcase', 
    color: '#3b82f6', 
    essential: false, 
    member: 'Ozi',
    subcategories: ['Salário Mensal', '13º Salário', 'Férias', 'Bônus']
  },
  { 
    id: 'cat_diaria_ozi', 
    name: 'Diárias de Trabalho (Ozi)', 
    type: 'income', 
    icon: 'calendar-check', 
    color: '#06b6d4', 
    essential: false, 
    member: 'Ozi',
    subcategories: ['Diária', 'Plantão', 'Extra']
  },
  
  // Outras Receitas
  { 
    id: 'cat_freelance', 
    name: 'Freelance & Serviços Extras', 
    type: 'income', 
    icon: 'laptop', 
    color: '#10b981', 
    essential: false, 
    member: 'Ambos',
    subcategories: ['Freelance', 'Consultoria', 'Venda de Item']
  },
  { 
    id: 'cat_invest', 
    name: 'Rendimentos & Investimentos', 
    type: 'income', 
    icon: 'trending-up', 
    color: '#8b5cf6', 
    essential: false, 
    member: 'Ambos',
    subcategories: ['Dividendos', 'JCP', 'Rendimento CDB', 'Lucro FII']
  },
  
  // ==================== DESPESAS SOLICITADAS ====================
  // 1. Transporte
  { 
    id: 'cat_transport', 
    name: 'Transporte', 
    type: 'expense', 
    icon: 'car', 
    color: '#3b82f6', 
    essential: true, 
    member: 'Ambos',
    subcategories: [
      'Combustível', 
      'Parcela Carro', 
      'Estacionamento', 
      'Manutenção Preventiva', 
      'Manutenção Corretiva', 
      'Lavagem', 
      'Uber', 
      'Multa', 
      'Seguro', 
      'IPVA', 
      'Licenciamento'
    ]
  },

  // 2. Vestuário e Imagem
  { 
    id: 'cat_clothing_image', 
    name: 'Vestuário e Imagem', 
    type: 'expense', 
    icon: 'sparkles', 
    color: '#ec4899', 
    essential: false, 
    member: 'Ambos',
    subcategories: [
      'Roupas', 
      'Calçados', 
      'Acessórios', 
      'Salão', 
      'Estética', 
      'Cosméticos'
    ]
  },

  // 3. Alimentação
  { 
    id: 'cat_food', 
    name: 'Alimentação', 
    type: 'expense', 
    icon: 'shopping-cart', 
    color: '#f59e0b', 
    essential: true, 
    member: 'Ambos',
    subcategories: [
      'Mercado', 
      'Feira', 
      'Açougue', 
      'Delivery'
    ]
  },

  // 4. Moradia
  { 
    id: 'cat_housing', 
    name: 'Moradia', 
    type: 'expense', 
    icon: 'home', 
    color: '#ef4444', 
    essential: true, 
    member: 'Ambos',
    subcategories: [
      'Aluguel', 
      'Condomínio', 
      'IPTU', 
      'Água', 
      'Gás', 
      'Luz', 
      'Internet residencial', 
      'Manutenção da casa', 
      'Reparos Emergenciais', 
      'Móveis e eletrodomésticos'
    ]
  },

  // 5. Lazer
  { 
    id: 'cat_leisure', 
    name: 'Lazer', 
    type: 'expense', 
    icon: 'coffee', 
    color: '#8b5cf6', 
    essential: false, 
    member: 'Ambos',
    subcategories: [
      'Celebrações', 
      'Presentes', 
      'Bares', 
      'Cinema', 
      'Show', 
      'Passeios', 
      'Viagem', 
      'Cafeteria'
    ]
  },

  // 6. Saúde
  { 
    id: 'cat_health', 
    name: 'Saúde', 
    type: 'expense', 
    icon: 'activity', 
    color: '#10b981', 
    essential: true, 
    member: 'Ambos',
    subcategories: [
      'Plano de Saúde', 
      'Consultas Médicas', 
      'Terapia', 
      'Medicamentos', 
      'Exames', 
      'Odontologista', 
      'Academia', 
      'Massagens'
    ]
  },

  // 7. Educação
  { 
    id: 'cat_education', 
    name: 'Educação', 
    type: 'expense', 
    icon: 'book-open', 
    color: '#6366f1', 
    essential: false, 
    member: 'Ambos',
    subcategories: [
      'Nova Acrópole', 
      'Cursos', 
      'Livros', 
      'Palestras', 
      'Mentorias', 
      'Assinatura Educacional'
    ]
  },

  // 8. Pet
  { 
    id: 'cat_pet', 
    name: 'Pet', 
    type: 'expense', 
    icon: 'heart', 
    color: '#d97706', 
    essential: false, 
    member: 'Ambos',
    subcategories: [
      'Ração', 
      'Veterinário', 
      'Vacinas', 
      'Medicamentos', 
      'Banho e Tosa', 
      'Brinquedos', 
      'Creche e Hotel', 
      'Acessórios'
    ]
  },

  // 9. Streaming
  { 
    id: 'cat_streaming', 
    name: 'Streaming', 
    type: 'expense', 
    icon: 'tv', 
    color: '#e11d48', 
    essential: false, 
    member: 'Ambos',
    subcategories: [
      'Netflix', 
      'Spotify', 
      'Amazon Prime'
    ]
  },

  // 10. Telefonia
  { 
    id: 'cat_telephony', 
    name: 'Telefonia', 
    type: 'expense', 
    icon: 'smartphone', 
    color: '#06b6d4', 
    essential: true, 
    member: 'Ambos',
    subcategories: [
      'Cel Ju', 
      'Cel Ozi'
    ]
  },

  // 11. Impostos
  { 
    id: 'cat_taxes', 
    name: 'Impostos', 
    type: 'expense', 
    icon: 'landmark', 
    color: '#dc2626', 
    essential: true, 
    member: 'Ambos',
    subcategories: [
      'Imposto de Renda'
    ]
  },

  // 12. Taxas
  { 
    id: 'cat_fees', 
    name: 'Taxas', 
    type: 'expense', 
    icon: 'percent', 
    color: '#64748b', 
    essential: false, 
    member: 'Ambos',
    subcategories: [
      'Tarifa Bancária', 
      'Anuidade Cartão', 
      'Juros', 
      'Manutenção Conta'
    ]
  },

  // 13. Investimentos
  { 
    id: 'cat_invest_expense', 
    name: 'Investimentos', 
    type: 'expense', 
    icon: 'trending-up', 
    color: '#059669', 
    essential: false, 
    member: 'Ambos',
    subcategories: [
      'Ações', 
      'FIIs', 
      'Renda Fixa', 
      'Meta Ju e Ozi'
    ]
  },

  // 14. Jardinagem
  { 
    id: 'cat_gardening', 
    name: 'Jardinagem', 
    type: 'expense', 
    icon: 'sprout', 
    color: '#84cc16', 
    essential: false, 
    member: 'Ambos',
    subcategories: [
      'Mudas', 
      'Terra', 
      'Equipamentos', 
      'Sementes', 
      'Flores'
    ]
  },

  // 15. Outros
  { 
    id: 'cat_other', 
    name: 'Outros', 
    type: 'expense', 
    icon: 'more-horizontal', 
    color: '#9ca3af', 
    essential: false, 
    member: 'Ambos',
    subcategories: [
      'Doação', 
      'Extras'
    ]
  }
];

// Contas Padrão Solicitadas (C6 Bank, Mercado Pago, Nubank) com saldo inicial zerado
export const DEFAULT_ACCOUNTS = [
  { id: 'acc_c6', name: 'C6 Bank', type: 'checking', initialBalance: 0.00, color: '#27272a' },
  { id: 'acc_mercadopago', name: 'Mercado Pago', type: 'checking', initialBalance: 0.00, color: '#0284c7' },
  { id: 'acc_nubank', name: 'Nubank', type: 'checking', initialBalance: 0.00, color: '#8b5cf6' }
];

// Orçamentos Padrão (zerados)
export const DEFAULT_BUDGETS = [];

// Metas Padrão (zeradas)
export const DEFAULT_GOALS = [];

// Gerador de Transações de Demonstração (zerado para controle real do usuário)
export function generateDemoTransactions() {
  return [];
}

// Funções de Inicialização e Persistência
export function loadState() {
  const isBrowser = typeof localStorage !== 'undefined';
  
  // Limpar chaves legadas com dados de mock ou categorias antigas
  if (isBrowser) {
    localStorage.removeItem('gestao_fin_transactions_v2');
    localStorage.removeItem('gestao_fin_accounts_v2');
    localStorage.removeItem('gestao_fin_budgets_v2');
    localStorage.removeItem('gestao_fin_goals_v2');
    localStorage.removeItem('gestao_fin_categories_v3');
  }

  const storedTx = isBrowser ? localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) : null;
  const transactions = storedTx !== null ? JSON.parse(storedTx) : [];
  
  // Carregar categorias atualizadas (versão v4 com 15 categorias e subcategorias)
  let categories = isBrowser && localStorage.getItem(STORAGE_KEYS.CATEGORIES) 
    ? JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) 
    : DEFAULT_CATEGORIES;
    
  // Validação para garantir que novas categorias existem no estado atual
  if (!categories || !categories.some(c => c.id === 'cat_clothing_image') || !categories.some(c => c.id === 'cat_pet')) {
    categories = DEFAULT_CATEGORIES;
    if (isBrowser) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
  }
  
  let accounts = isBrowser && localStorage.getItem(STORAGE_KEYS.ACCOUNTS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) : null;
  if (!accounts || !accounts.some(a => a.id === 'acc_c6') || !accounts.some(a => a.id === 'acc_mercadopago')) {
    accounts = DEFAULT_ACCOUNTS;
  }

  const budgets = isBrowser && localStorage.getItem(STORAGE_KEYS.BUDGETS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS)) : DEFAULT_BUDGETS;
  const goals = isBrowser && localStorage.getItem(STORAGE_KEYS.GOALS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS)) : DEFAULT_GOALS;
  const recurring = isBrowser && localStorage.getItem(STORAGE_KEYS.RECURRING) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURRING)) : [];
  const investments = isBrowser && localStorage.getItem(STORAGE_KEYS.INVESTMENTS) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.INVESTMENTS)) : [];

  saveState({ transactions, categories, accounts, budgets, goals, recurring, investments });

  return { transactions, categories, accounts, budgets, goals, recurring, investments };
}

export function saveState(state) {
  if (typeof localStorage === 'undefined') return;
  if (Array.isArray(state.transactions)) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
  if (state.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
  if (state.accounts) localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(state.accounts));
  if (state.budgets) localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(state.budgets));
  if (state.goals) localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
  if (state.recurring) localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(state.recurring));
  if (state.investments) localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(state.investments));
}

export function clearAllTransactions() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  }
  return [];
}

// Exportar CSV com coluna de Responsável
export function exportTransactionsCSV(transactions, categories, accounts) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const accMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));

  const headers = ['ID', 'Data / Dia', 'Responsável', 'Tipo', 'Descrição', 'Categoria', 'Conta', 'Valor (R$)', 'Status'];
  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.person || 'Ambos',
    t.type === 'income' ? 'Receita' : (t.type === 'expense' ? 'Despesa' : 'Transferência'),
    `"${(t.desc || '').replace(/"/g, '""')}"`,
    `"${catMap[t.categoryId] || 'N/A'}"`,
    `"${accMap[t.accountId] || 'N/A'}"`,
    t.amount.toFixed(2),
    t.status === 'paid' ? 'Pago' : 'Pendente'
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `gestao_financeira_extrato_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar Backup JSON
export function exportBackupJSON(state) {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `gestao_financeira_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
