/**
 * Gestão Financeira - Módulo de Comando por Voz (Web Speech API + NLP em Português)
 * Interpreta: Quem falou (Ju/Ozi/Ambos), Tipo (Despesa/Receita), Valor, Pagamento e Estabelecimento
 */

import { formatCurrency, generateId, showToast } from './utils.js';
import { suggestCategoryAndSubcategory, suggestCategoryFromDesc } from './import_spreadsheet.js';

let recognition = null;
let isListening = false;
let lastDetectedSubcategory = null;

// Dicionário de números em português para converter fala por extenso em números
const NUMBER_WORDS = {
  'zero': 0, 'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'três': 3, 'tres': 3,
  'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
  'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'catorze': 14, 'quinze': 15,
  'dezesseis': 16, 'dezessete': 17, 'dezoito': 18, 'dezenove': 19, 'vinte': 20,
  'trinta': 30, 'quarenta': 40, 'cinquenta': 50, 'sessenta': 60, 'setenta': 70,
  'oitenta': 80, 'noventa': 90, 'cem': 100, 'cento': 100, 'duzentos': 200,
  'duzentas': 200, 'trezentos': 300, 'trezentas': 300, 'quatrocentos': 400,
  'quatrocentas': 400, 'quinhentos': 500, 'quinhentas': 500, 'seiscentos': 600,
  'seiscentas': 600, 'setecentos': 700, 'setecentas': 700, 'oitocentos': 800,
  'oitocentas': 800, 'novecentos': 900, 'novecentas': 900, 'mil': 1000
};

export function initVoiceCommand(state, onStateChange) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  const modalVoice = document.getElementById('modal-voice');
  const btnTriggerVoiceHeader = document.getElementById('btn-voice-header');
  const btnTriggerVoiceModal = document.getElementById('btn-voice-modal-tx');
  const btnTriggerVoiceBottom = document.getElementById('btn-bottom-voice');
  const btnCloseVoiceModal = document.getElementById('btn-close-voice-modal');
  const btnMicToggle = document.getElementById('btn-voice-mic-toggle');
  const btnConfirmVoiceTx = document.getElementById('btn-confirm-voice-tx');
  const btnCancelVoiceTx = document.getElementById('btn-cancel-voice-tx');

  if (!SpeechRecognition) {
    console.warn('Reconhecimento de voz não suportado neste navegador.');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = true;

  // Abrir Modal de Voz
  const openVoiceModal = () => {
    if (modalVoice) {
      modalVoice.classList.add('active');
      resetVoiceModalState();
      startVoiceListening(state);
    }
  };

  btnTriggerVoiceHeader?.addEventListener('click', openVoiceModal);
  btnTriggerVoiceModal?.addEventListener('click', openVoiceModal);
  btnTriggerVoiceBottom?.addEventListener('click', openVoiceModal);

  btnCloseVoiceModal?.addEventListener('click', () => {
    stopVoiceListening();
    modalVoice?.classList.remove('active');
  });

  btnCancelVoiceTx?.addEventListener('click', () => {
    resetVoiceModalState();
    startVoiceListening(state);
  });

  btnMicToggle?.addEventListener('click', () => {
    if (isListening) {
      stopVoiceListening();
    } else {
      startVoiceListening(state);
    }
  });

  // Salvar transação interpretada por voz
  btnConfirmVoiceTx?.addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('voice-interpreted-amount')?.value || 0);
    const desc = document.getElementById('voice-interpreted-desc')?.value || 'Transação por Voz';
    const type = document.getElementById('voice-interpreted-type')?.value || 'expense';
    const person = document.getElementById('voice-interpreted-person')?.value || 'Ambos';
    const categoryId = document.getElementById('voice-interpreted-cat')?.value || 'cat_food';
    const accountId = document.getElementById('voice-interpreted-account')?.value || state.accounts[0]?.id || 'acc_nubank';
    const date = new Date().toISOString().split('T')[0];

    if (amount <= 0) {
      showToast('Valor inválido. Fale ou digite o valor do lançamento.', 'warning');
      return;
    }

    const newTx = {
      id: generateId('tx_voice'),
      type,
      desc,
      amount,
      categoryId,
      subcategory: lastDetectedSubcategory || (suggestCategoryAndSubcategory(desc, type, person).subcategory) || null,
      accountId,
      date,
      status: 'paid',
      person
    };

    state.transactions.unshift(newTx);
    onStateChange();

    // Feedback por fala opcional
    speakFeedback(`Lançamento de ${amount} reais para ${person} salvo com sucesso!`);
    showToast(`Transação de voz salva para ${person}!`, 'success');

    modalVoice?.classList.remove('active');
    document.getElementById('modal-transaction')?.classList.remove('active');
  });

  // Eventos do SpeechRecognition
  recognition.onstart = () => {
    isListening = true;
    updateVoiceUIListening(true);
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    const transcriptEl = document.getElementById('voice-live-transcript');
    if (transcriptEl) transcriptEl.textContent = `"${transcript}"`;

    if (event.results[0].isFinal) {
      const parsedData = parseVoiceSentence(transcript, state);
      displayInterpretedResult(parsedData, state);
    }
  };

  recognition.onerror = (event) => {
    console.error('Erro no reconhecimento de voz:', event.error);
    isListening = false;
    updateVoiceUIListening(false);
    if (event.error === 'not-allowed') {
      showToast('Permissão de microfone negada. Permita o microfone no navegador.', 'error');
    } else if (event.error !== 'no-speech') {
      showToast('Não consegui ouvir com clareza. Tente falar novamente.', 'warning');
    }
  };

  recognition.onend = () => {
    isListening = false;
    updateVoiceUIListening(false);
  };
}

function startVoiceListening(state) {
  if (!recognition) return;
  try {
    recognition.start();
  } catch (err) {
    console.log('Recognition already active');
  }
}

function stopVoiceListening() {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch (err) {}
  isListening = false;
  updateVoiceUIListening(false);
}

function updateVoiceUIListening(listening) {
  const micBtn = document.getElementById('btn-voice-mic-toggle');
  const waveEl = document.getElementById('voice-sound-waves');
  const statusTitle = document.getElementById('voice-status-title');
  const statusSub = document.getElementById('voice-status-sub');

  if (listening) {
    micBtn?.classList.add('recording');
    waveEl?.classList.add('active');
    if (statusTitle) statusTitle.textContent = 'Ouvindo você...';
    if (statusSub) statusSub.textContent = 'Fale quem é, se é gasto/receita, valor e forma de pagamento.';
  } else {
    micBtn?.classList.remove('recording');
    waveEl?.classList.remove('active');
    if (statusTitle) statusTitle.textContent = 'Microfone em pausa';
    if (statusSub) statusSub.textContent = 'Toque no microfone para falar novamente.';
  }
}

/**
 * Interpretador Semântico (NLP em Português) para Comandos de Voz
 */
export function parseVoiceSentence(sentence, state) {
  const text = sentence.toLowerCase().trim();

  // 1. QUEM ESTÁ FALANDO (RESPONSÁVEL)
  let person = 'Ambos';
  if (text.includes('ju falando') || text.includes('aqui é a ju') || text.includes('aqui e a ju') || text.includes('sou a ju') || text.includes('pra ju') || text.includes('para a ju') || text.includes('da ju') || text.includes('juliana') || text.includes(' ju ') || text.startsWith('ju ')) {
    person = 'Ju';
  } else if (text.includes('ozi falando') || text.includes('aqui é a ozi') || text.includes('aqui e a ozi') || text.includes('sou a ozi') || text.includes('pra ozi') || text.includes('para a ozi') || text.includes('da ozi') || text.includes('ozilda') || text.includes(' ozi ') || text.startsWith('ozi ')) {
    person = 'Ozi';
  } else if (text.includes('casa') || text.includes('ambos') || text.includes('nós') || text.includes('nosso')) {
    person = 'Ambos';
  }

  // 2. TIPO (DESPESA OU RECEITA)
  let type = 'expense';
  const incomeWords = ['recebi', 'receita', 'salário', 'salario', 'diária', 'diaria', 'ganhei', 'rendimento', 'freela', 'entrou', 'pagamento da diária'];
  const isIncome = incomeWords.some(w => text.includes(w));
  if (isIncome) {
    type = 'income';
  }

  // 3. EXTRAÇÃO DO VALOR MONETÁRIO (R$)
  let amount = 0;
  // Tentar encontrar padrão de dígitos (ex: 150,50 ou 150 reais)
  const digitMatch = text.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)?/i);
  if (digitMatch && digitMatch[1]) {
    amount = parseFloat(digitMatch[1].replace(',', '.'));
  } else {
    // Tentar converter palavras faladas por extenso (ex: "cinquenta reais", "cento e cinquenta")
    amount = parseSpokenNumberToFloat(text);
  }

  // 4. TIPO DE PAGAMENTO / CONTA (C6 Bank, Mercado Pago, Nubank)
  let accountId = state.accounts[0]?.id || 'acc_nubank';
  if (text.includes('c6') || text.includes('c 6') || text.includes('carbon') || text.includes('c-6')) {
    const c6 = state.accounts.find(a => a.id.includes('c6') || a.name.toLowerCase().includes('c6'));
    accountId = c6 ? c6.id : 'acc_c6';
  } else if (text.includes('mercado pago') || text.includes('mercadopago') || /\bmp\b/i.test(text)) {
    const mp = state.accounts.find(a => a.id.includes('mercadopago') || a.name.toLowerCase().includes('mercado pago'));
    accountId = mp ? mp.id : 'acc_mercadopago';
  } else if (text.includes('nubank') || text.includes('nu ') || text.includes('roxinho') || text.includes('pix') || text.includes('crédito') || text.includes('débito')) {
    const nu = state.accounts.find(a => a.id.includes('nubank') || a.name.toLowerCase().includes('nubank'));
    accountId = nu ? nu.id : 'acc_nubank';
  }

  // 5. DESCRIÇÃO E CATEGORIA
  let desc = '';
  let categoryId = 'cat_other';
  let subcategory = null;

  if (type === 'income') {
    if (text.includes('diária') || text.includes('diaria')) {
      desc = `Diária de Trabalho (${person})`;
      categoryId = person === 'Ju' ? 'cat_diaria_ju' : (person === 'Ozi' ? 'cat_diaria_ozi' : 'cat_freelance');
      subcategory = 'Diária';
    } else if (text.includes('salário') || text.includes('salario')) {
      desc = `Salário (${person})`;
      categoryId = person === 'Ju' ? 'cat_salary_ju' : (person === 'Ozi' ? 'cat_salary_ozi' : 'cat_salary_ju');
      subcategory = 'Salário Mensal';
    } else if (text.includes('freela') || text.includes('serviço')) {
      desc = 'Serviço Freelance / Extra';
      categoryId = 'cat_freelance';
      subcategory = 'Freelance';
    } else {
      desc = cleanSpokenDescription(text) || `Receita (${person})`;
      const sugg = suggestCategoryAndSubcategory(desc, 'income', person);
      categoryId = sugg.categoryId;
      subcategory = sugg.subcategory;
    }
  } else {
    desc = cleanSpokenDescription(text) || 'Gasto Informado por Voz';
    const sugg = suggestCategoryAndSubcategory(desc, 'expense', person);
    categoryId = sugg.categoryId;
    subcategory = sugg.subcategory;
  }

  lastDetectedSubcategory = subcategory;

  return {
    person,
    type,
    amount: amount > 0 ? amount : '',
    desc: desc.charAt(0).toUpperCase() + desc.slice(1),
    accountId,
    categoryId,
    subcategory,
    originalText: sentence
  };
}

/**
 * Converte fala de valores por extenso para número float
 * Ex: "cento e cinquenta reais e trinta centavos" -> 150.30
 */
function parseSpokenNumberToFloat(text) {
  let clean = text.replace(/reais|real/g, '').trim();
  let parts = clean.split(/e centavos|centavos|com/);
  let integerPartStr = parts[0] || '';
  let decimalPartStr = parts[1] || '';

  let integerWords = integerPartStr.match(/[a-zà-ú]+/g) || [];
  let totalInt = 0;
  let currentGroup = 0;

  for (const word of integerWords) {
    if (NUMBER_WORDS[word] !== undefined) {
      const val = NUMBER_WORDS[word];
      if (val === 1000) {
        totalInt += (currentGroup === 0 ? 1 : currentGroup) * 1000;
        currentGroup = 0;
      } else if (val >= 100) {
        currentGroup += val;
      } else {
        currentGroup += val;
      }
    }
  }
  totalInt += currentGroup;

  // Centavos se houver
  let cents = 0;
  if (decimalPartStr) {
    let decWords = decimalPartStr.match(/[a-zà-ú]+/g) || [];
    let decVal = 0;
    for (const w of decWords) {
      if (NUMBER_WORDS[w] !== undefined) decVal += NUMBER_WORDS[w];
    }
    cents = decVal / 100;
  }

  return totalInt + cents;
}

/**
 * Limpa frases de preenchimento para obter a descrição concisa do gasto
 */
function cleanSpokenDescription(text) {
  let cleaned = text
    .replace(/(?:aqui é a|aqui e a|sou a|falando|ju|ozi|juliana|ozilda)/gi, '')
    .replace(/(?:gastei|comprei|paguei|custou|despesa|recebi|ganhei|receita|salário|salario|diária|diaria)/gi, '')
    .replace(/(?:no cartão de crédito|no cartão de débito|no cartao de credito|no cartao de debito|no cartão|no cartao|no débito|no debito|no crédito|no credito|no pix|em dinheiro|no dinheiro|no mercado pago|no mercadopago|no c6 bank|no c6|no nubank|na xp|no banco)/gi, '')
    .replace(/(?:mercado pago|mercadopago|c6 bank|c6|nubank|cartão de crédito|cartão de débito|cartao de credito|cartao de debito|cartão|cartao|pix|dinheiro|debito|crédito)/gi, '')
    .replace(/(?:reais|real|centavos|hoje|ontem|pelo|pela|pago)/gi, '')
    .replace(/\b(?:zero|um|uma|dois|duas|três|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecentos|mil)\b/gi, '')
    .replace(/\b\d+([.,]\d+)?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  cleaned = cleaned.replace(/^[\s,.;:/-]+|[\s,.;:/-]+$/g, '').trim();

  // Remove preposições e artigos soltos no início
  while (/^(?:no|na|em|de|da|do|para|pra|com|um|uma|o|a|pelo|pela)\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(?:no|na|em|de|da|do|para|pra|com|um|uma|o|a|pelo|pela)\s+/i, '');
  }

  // Remove preposições e artigos soltos no fim
  while (/\s+(?:no|na|em|de|da|do|para|pra|com|pelo|pela|pago)$/i.test(cleaned)) {
    cleaned = cleaned.replace(/\s+(?:no|na|em|de|da|do|para|pra|com|pelo|pela|pago)$/i, '');
  }

  cleaned = cleaned.replace(/^[\s,.;:/-]+|[\s,.;:/-]+$/g, '').trim();

  return cleaned;
}

function displayInterpretedResult(data, state) {
  const resultCard = document.getElementById('voice-result-card');
  const typeInp = document.getElementById('voice-interpreted-type');
  const amountInp = document.getElementById('voice-interpreted-amount');
  const descInp = document.getElementById('voice-interpreted-desc');
  const personInp = document.getElementById('voice-interpreted-person');
  const catInp = document.getElementById('voice-interpreted-cat');
  const accInp = document.getElementById('voice-interpreted-account');

  if (resultCard) resultCard.classList.remove('hidden');

  if (typeInp) typeInp.value = data.type;
  if (amountInp) amountInp.value = data.amount || '';
  if (descInp) descInp.value = data.desc || '';
  if (personInp) personInp.value = data.person;

  if (catInp) {
    catInp.innerHTML = state.categories.map(c => `<option value="${c.id}" ${c.id === data.categoryId ? 'selected' : ''}>${c.name}</option>`).join('');
  }

  if (accInp) {
    accInp.innerHTML = state.accounts.map(a => `<option value="${a.id}" ${a.id === data.accountId ? 'selected' : ''}>${a.name}</option>`).join('');
  }

  if (window.lucide) window.lucide.createIcons();
}

function resetVoiceModalState() {
  document.getElementById('voice-result-card')?.classList.add('hidden');
  const transcriptEl = document.getElementById('voice-live-transcript');
  if (transcriptEl) transcriptEl.textContent = 'Diga por exemplo: "Ju falando, gastei 80 reais no mercado no débito"';
}

function speakFeedback(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }
}
