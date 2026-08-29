/**
 * Gestão Financeira - Módulo de Sincronização em Nuvem (Vercel Postgres Client)
 */

let isOnline = true;
let isCloudAvailable = false;
let syncInterval = null;

export function updateCloudStatusUI(status, label) {
  const statusEl = document.getElementById('cloud-sync-status');
  if (!statusEl) return;

  const dot = statusEl.querySelector('.status-dot');
  const text = statusEl.querySelector('.status-text');

  if (dot) {
    dot.className = `status-dot ${status}`;
  }
  if (text && label) {
    text.textContent = label;
  }
}

/**
 * Inicializa a sincronização com o Vercel Postgres
 */
export async function initCloudSync(appState, onStateChange) {
  updateCloudStatusUI('syncing', 'Conectando à nuvem...');

  try {
    // 1. Tentar ler estado do banco Vercel Postgres
    const res = await fetch('/api/state', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`Servidor respondeu com status ${res.status}`);
    }

    const json = await res.json();

    if (json && json.success) {
      isCloudAvailable = true;

      // Se o banco ainda não foi inicializado com tabelas, chama /api/init
      if (json.initialized === false) {
        try {
          await fetch('/api/init');
        } catch (e) {
          console.warn('Init call warn:', e);
        }
      }

      const cloudData = json.data;

      // Se a nuvem tem dados, sincroniza para o appState
      if (cloudData) {
        if (Array.isArray(cloudData.transactions) && cloudData.transactions.length > 0) {
          appState.transactions = cloudData.transactions;
        } else if (appState.transactions && appState.transactions.length > 0) {
          // Se banco estiver vazio mas tivermos transações locais, envia para a nuvem
          syncFullStateToCloud(appState);
        }

        if (Array.isArray(cloudData.categories) && cloudData.categories.length > 0) {
          appState.categories = cloudData.categories;
        }
        if (Array.isArray(cloudData.accounts) && cloudData.accounts.length > 0) {
          appState.accounts = cloudData.accounts;
        }
        if (Array.isArray(cloudData.budgets)) {
          appState.budgets = cloudData.budgets;
        }
        if (Array.isArray(cloudData.goals)) {
          appState.goals = cloudData.goals;
        }
        if (Array.isArray(cloudData.recurring)) {
          appState.recurring = cloudData.recurring;
        }
        if (Array.isArray(cloudData.investments)) {
          appState.investments = cloudData.investments;
        }

        // Salva cache localmente
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gestao_fin_transactions_v3', JSON.stringify(appState.transactions));
          localStorage.setItem('gestao_fin_categories_v4', JSON.stringify(appState.categories));
          localStorage.setItem('gestao_fin_accounts_v3', JSON.stringify(appState.accounts));
          localStorage.setItem('gestao_fin_budgets_v3', JSON.stringify(appState.budgets));
          localStorage.setItem('gestao_fin_goals_v3', JSON.stringify(appState.goals));
          localStorage.setItem('gestao_fin_recurring_v3', JSON.stringify(appState.recurring));
          localStorage.setItem('gestao_fin_investments_v3', JSON.stringify(appState.investments));
        }

        updateCloudStatusUI('online', 'Nuvem Conectada');
        if (onStateChange) onStateChange();
      } else {
        updateCloudStatusUI('online', 'Nuvem Conectada');
      }

      // Iniciar polling em segundo plano a cada 30 segundos para capturar novos gastos do parceiro(a)
      startCloudPolling(appState, onStateChange);
    } else {
      throw new Error('Formato de resposta inesperado');
    }
  } catch (err) {
    console.info('Modo Local Ativo (Vercel Postgres indisponível no ambiente atual):', err.message);
    isCloudAvailable = false;
    updateCloudStatusUI('offline', 'Modo Local');
  }

  // Listeners de Conectividade do Navegador
  window.addEventListener('online', () => {
    isOnline = true;
    initCloudSync(appState, onStateChange);
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    updateCloudStatusUI('offline', 'Sem Internet (Offline)');
  });
}

/**
 * Envia uma alteração pontual para o banco Vercel Postgres
 */
export async function syncItemToCloud(action, item, id) {
  if (!isCloudAvailable || !navigator.onLine) return;

  try {
    updateCloudStatusUI('syncing', 'Sincronizando...');
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, item, id })
    });

    if (res.ok) {
      updateCloudStatusUI('online', 'Nuvem Conectada');
    } else {
      updateCloudStatusUI('online', 'Nuvem Conectada');
    }
  } catch (err) {
    console.warn('Erro ao sincronizar item com Postgres:', err);
    updateCloudStatusUI('offline', 'Salvo Localmente');
  }
}

/**
 * Envia o estado completo para o banco Vercel Postgres
 */
export async function syncFullStateToCloud(state) {
  if (!isCloudAvailable || !navigator.onLine) return;

  try {
    updateCloudStatusUI('syncing', 'Sincronizando...');
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: state.transactions,
        budgets: state.budgets,
        goals: state.goals,
        recurring: state.recurring,
        investments: state.investments
      })
    });
    updateCloudStatusUI('online', 'Nuvem Conectada');
  } catch (err) {
    console.warn('Erro ao sincronizar estado completo com Postgres:', err);
  }
}

/**
 * Polling para buscar atualizações remotas feitas no outro celular
 */
function startCloudPolling(appState, onStateChange) {
  if (syncInterval) clearInterval(syncInterval);

  syncInterval = setInterval(async () => {
    if (!isCloudAvailable || !navigator.onLine || document.hidden) return;

    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          const remoteTxs = json.data.transactions;
          if (Array.isArray(remoteTxs)) {
            // Verificar se houve novas transações ou alterações
            if (remoteTxs.length !== appState.transactions.length || JSON.stringify(remoteTxs[0]) !== JSON.stringify(appState.transactions[0])) {
              appState.transactions = remoteTxs;
              if (onStateChange) onStateChange();
            }
          }
        }
      }
    } catch (e) {
      // Falha silenciosa de polling
    }
  }, 30000); // 30 segundos
}
