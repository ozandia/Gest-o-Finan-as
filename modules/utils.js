/**
 * FinFlow - Utilitários de Formatação, Datas e Notificações Toasts
 */

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2
});

export function formatCurrency(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return 'R$ 0,00';
  return currencyFormatter.format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function formatMonthYear(date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(date);
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

export function filterTransactionsByPeriod(transactions, periodOption) {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-11

  return transactions.filter(t => {
    if (!t.date) return false;
    const [tY, tM, tD] = t.date.split('-').map(Number);
    const txDate = new Date(tY, tM - 1, tD);

    switch (periodOption) {
      case 'current-month':
        return tY === curYear && (tM - 1) === curMonth;
      
      case 'last-month': {
        const lastMDate = new Date(curYear, curMonth - 1, 1);
        return tY === lastMDate.getFullYear() && (tM - 1) === lastMDate.getMonth();
      }

      case 'last-90': {
        const past90 = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        return txDate >= past90 && txDate <= now;
      }

      case 'current-year':
        return tY === curYear;

      case 'all':
      default:
        return true;
    }
  });
}

export function showToast(message, type = 'info', duration = 3500) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-circle';
  if (type === 'warning') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
