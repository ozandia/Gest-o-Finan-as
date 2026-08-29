/**
 * Gestão Financeira - Módulo de Leitura Inteligente de Prints / Comprovantes (OCR)
 * Suporta Comprovantes Pix, Faturas de Cartão, Recibos e Cupons Fiscais
 */

import { generateId, showToast } from './utils.js';
import { suggestCategoryAndSubcategory, suggestCategoryFromDesc } from './import_spreadsheet.js';

let currentReceiptImageData = null;
let lastExtractedSubcategory = null;

export function initReceiptOCR(state, onStateChange) {
  const dropzone = document.getElementById('receipt-dropzone');
  const fileInput = document.getElementById('input-receipt-file');
  const btnSelect = document.getElementById('btn-select-receipt-img');
  const formExtracted = document.getElementById('form-receipt-extracted');
  const btnReset = document.getElementById('btn-reset-receipt-ocr');

  // Trigger file select
  btnSelect?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('click', (e) => {
    if (e.target !== btnSelect && !btnSelect?.contains(e.target)) {
      fileInput?.click();
    }
  });

  // Drag & Drop
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
    });
  });

  dropzone?.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      processReceiptImage(files[0], state);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processReceiptImage(files[0], state);
    }
  });

  // Resetar OCR para tentar outro print
  btnReset?.addEventListener('click', () => {
    resetReceiptView();
  });

  // Salvar gasto extraído do print
  formExtracted?.addEventListener('submit', (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('receipt-extracted-amount')?.value || 0);
    const desc = document.getElementById('receipt-extracted-desc')?.value || 'Gasto Comprovante';
    const date = document.getElementById('receipt-extracted-date')?.value || new Date().toISOString().split('T')[0];
    const categoryId = document.getElementById('receipt-extracted-category')?.value || 'cat_food';
    const person = document.getElementById('receipt-extracted-person')?.value || 'Ambos';
    const accountId = document.getElementById('receipt-extracted-account')?.value || state.accounts[0]?.id || 'acc_nubank';

    if (amount <= 0) {
      showToast('Informe um valor válido maior que zero.', 'warning');
      return;
    }

    const newTx = {
      id: generateId('tx_ocr'),
      type: 'expense',
      desc,
      amount,
      categoryId,
      subcategory: lastExtractedSubcategory || (suggestCategoryAndSubcategory(desc, 'expense', person).subcategory) || null,
      accountId,
      date,
      status: 'paid',
      person
    };

    state.transactions.unshift(newTx);
    onStateChange();

    showToast(`Gasto de R$ ${amount.toFixed(2)} importado do print com sucesso!`, 'success');
    resetReceiptView();
    document.getElementById('modal-import')?.classList.remove('active');
  });

  // Listener Global de Colar (Ctrl + V) de Imagens
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // Abrir modal e ir para aba de print
          const modal = document.getElementById('modal-import');
          if (modal) {
            modal.classList.add('active');
            // Mudar para aba de receipt
            document.querySelectorAll('.import-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.import-tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector('.import-tab-btn[data-tab="tab-receipt"]')?.classList.add('active');
            document.getElementById('tab-receipt')?.classList.add('active');
          }
          processReceiptImage(file, state);
          break;
        }
      }
    }
  });
}

/**
 * Executa o processamento OCR inteligente na imagem do comprovante
 */
export async function processReceiptImage(imageFile, state) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    currentReceiptImageData = e.target.result;
    
    // Atualizar preview da imagem
    const imgEl = document.getElementById('receipt-preview-img');
    if (imgEl) imgEl.src = currentReceiptImageData;

    // Mostrar status do scanner
    const dropzone = document.getElementById('receipt-dropzone');
    const statusBox = document.getElementById('ocr-scanner-status');
    const extractedView = document.getElementById('receipt-extracted-view');
    const progressBar = document.getElementById('ocr-progress-bar');
    const statusTitle = document.getElementById('ocr-status-title');
    const statusDetail = document.getElementById('ocr-status-detail');

    if (dropzone) dropzone.classList.add('hidden');
    if (extractedView) extractedView.classList.add('hidden');
    if (statusBox) statusBox.classList.remove('hidden');

    try {
      if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract OCR não está carregado.');
      }

      if (statusTitle) statusTitle.textContent = 'Carregando inteligência de OCR...';
      if (progressBar) progressBar.style.width = '25%';

      const worker = await Tesseract.createWorker('por');

      if (statusTitle) statusTitle.textContent = 'Lendo textos e comprovantes...';
      if (statusDetail) statusDetail.textContent = 'Decodificando comprovante Pix, fatura ou cupom fiscal';
      if (progressBar) progressBar.style.width = '60%';

      const ret = await worker.recognize(currentReceiptImageData);
      const text = ret.data.text;
      await worker.terminate();

      if (progressBar) progressBar.style.width = '100%';

      // Analisar o texto extraído
      const extracted = parseReceiptText(text, state);

      // Preencher o formulário
      populateExtractedReceiptForm(extracted, state);

      if (statusBox) statusBox.classList.add('hidden');
      if (extractedView) extractedView.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();

      showToast('Comprovante lido com sucesso!', 'success');
    } catch (err) {
      console.error('Erro no OCR:', err);
      // Fallback para preenchimento manual com preview da imagem
      if (statusBox) statusBox.classList.add('hidden');
      if (extractedView) extractedView.classList.remove('hidden');
      populateExtractedReceiptForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        desc: 'Comprovante Importado',
        person: 'Ambos',
        categoryId: 'cat_food'
      }, state);
      showToast('Imagem carregada! Verifique os dados no formulário ao lado.', 'info');
    }
  };

  reader.readAsDataURL(imageFile);
}

/**
 * Analisador heurístico do texto do comprovante
 */
function parseReceiptText(rawText, state) {
  const text = rawText.replace(/\r/g, '\n');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let amount = null;
  let dateStr = '';
  let desc = '';
  let person = 'Ambos';

  // 1. EXTRAÇÃO DE VALOR (R$)
  // Padrões comuns: R$ 123,45 ou Valor: 123.45 ou Total R$ 123,45
  const amountRegexes = [
    /(?:VALOR|TOTAL|PAGO|PIX|LÍQUIDO|DEBITADO|VALOR DA COMPRA)\s*[:=]?\s*R?\$?\s*(\d{1,5}[.,]\d{2})/i,
    /R\$\s*(\d{1,5}[.,]\d{2})/i,
    /(\d{1,5}[.,]\d{2})\s*(?:BRL|REAIS)/i,
    /\b(\d{1,5},\d{2})\b/
  ];

  for (const regex of amountRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const valStr = match[1].replace(/\.(?=\d{3})/g, '').replace(',', '.');
      const parsedVal = parseFloat(valStr);
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amount = parsedVal;
        break;
      }
    }
  }

  // 2. EXTRAÇÃO DE DATA
  // Padrões: 28/08/2026, 28-08-2026, 28/08/26, 28 de Agosto
  const dateMatch = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/);
  if (dateMatch) {
    let day = dateMatch[1].padStart(2, '0');
    let month = dateMatch[2].padStart(2, '0');
    let year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
    if (parseInt(month) <= 12 && parseInt(day) <= 31) {
      dateStr = `${year}-${month}-${day}`;
    }
  }

  if (!dateStr) {
    dateStr = new Date().toISOString().split('T')[0];
  }

  // 3. EXTRAÇÃO DE ESTABELECIMENTO / DESCRIÇÃO
  const merchantKeywords = [
    'ifood', 'uber', 'mercado livre', 'mercadolivre', 'carrefour', 'pao de acucar',
    'drogasil', 'droga raia', 'posto', 'shell', 'ipiranga', 'bradesco', 'nubank',
    'netflix', 'spotify', 'amazon', 'shopee', 'magalu', 'smartfit', 'enel', 'sabesp',
    'rappi', 'zedelivery', 'padaria', 'restaurante', 'mcdonald'
  ];

  for (const kw of merchantKeywords) {
    if (text.toLowerCase().includes(kw)) {
      desc = kw.toUpperCase();
      break;
    }
  }

  if (!desc) {
    // Tenta encontrar linhas de "Para: Nome", "Destino: Nome", "Recebedor: Nome", "Estabelecimento: Nome"
    const targetMatch = text.match(/(?:Para|Destinat[áa]rio|Favorecido|Recebedor|Estabelecimento|Nome|Raz[ãa]o Social)\s*[:=]?\s*([A-Za-z0-9\s.]{3,35})/i);
    if (targetMatch && targetMatch[1]) {
      desc = targetMatch[1].trim();
    }
  }

  if (!desc) {
    // Pega a primeira linha com texto razoável
    const candidateLine = lines.find(l => l.length > 3 && l.length < 40 && !/^\d+/.test(l) && !l.toLowerCase().includes('comprovante'));
    desc = candidateLine ? candidateLine : 'Compra em Comprovante';
  }

  // 4. DETECÇÃO DE RESPONSÁVEL (JU / OZI)
  if (text.toLowerCase().includes('juliana') || text.toLowerCase().includes('ju ')) {
    person = 'Ju';
  } else if (text.toLowerCase().includes('oziel') || text.toLowerCase().includes('ozi ') || text.toLowerCase().includes('ozilda') || text.toLowerCase().includes('ozi')) {
    person = 'Ozi';
  }

  // 5. CATEGORIA E SUBCATEGORIA SUGERIDAS
  const sugg = suggestCategoryAndSubcategory(desc, 'expense', person);
  lastExtractedSubcategory = sugg.subcategory;

  return {
    amount: amount || '',
    date: dateStr,
    desc: desc.substring(0, 60),
    person,
    categoryId: sugg.categoryId,
    subcategory: sugg.subcategory
  };
}

function populateExtractedReceiptForm(data, state) {
  const amtInp = document.getElementById('receipt-extracted-amount');
  const descInp = document.getElementById('receipt-extracted-desc');
  const dateInp = document.getElementById('receipt-extracted-date');
  const catSel = document.getElementById('receipt-extracted-category');
  const personSel = document.getElementById('receipt-extracted-person');
  const accSel = document.getElementById('receipt-extracted-account');

  if (amtInp) amtInp.value = data.amount || '';
  if (descInp) descInp.value = data.desc || '';
  if (dateInp) dateInp.value = data.date || new Date().toISOString().split('T')[0];

  if (catSel) {
    catSel.innerHTML = state.categories.map(c => `<option value="${c.id}" ${c.id === data.categoryId ? 'selected' : ''}>${c.name}</option>`).join('');
  }

  if (personSel) {
    personSel.value = data.person || 'Ambos';
  }

  if (accSel) {
    accSel.innerHTML = state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  }
}

function resetReceiptView() {
  currentReceiptImageData = null;
  document.getElementById('receipt-dropzone')?.classList.remove('hidden');
  document.getElementById('ocr-scanner-status')?.classList.add('hidden');
  document.getElementById('receipt-extracted-view')?.classList.add('hidden');
  const fileInput = document.getElementById('input-receipt-file');
  if (fileInput) fileInput.value = '';
}
