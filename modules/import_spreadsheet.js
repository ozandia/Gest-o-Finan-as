/**
 * Gestão Financeira - Módulo de Importação Inteligente de Planilhas (CSV / Excel)
 */

import { formatCurrency, generateId, showToast } from './utils.js';

let parsedRowsBuffer = [];

export function initSpreadsheetImport(state, onStateChange) {
  const dropzone = document.getElementById('spreadsheet-dropzone');
  const fileInput = document.getElementById('input-spreadsheet-file');
  const btnSelect = document.getElementById('btn-select-spreadsheet');
  const btnTogglePaste = document.getElementById('btn-toggle-paste-csv');
  const pasteContainer = document.getElementById('paste-csv-container');
  const btnParsePasted = document.getElementById('btn-parse-pasted-csv');
  const textareaPaste = document.getElementById('textarea-paste-csv');
  const btnConfirm = document.getElementById('btn-confirm-import-spreadsheet');
  const btnCancelPreview = document.getElementById('btn-cancel-import-preview');

  // Trigger file selection
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
    if (files && files.length > 0) {
      handleSpreadsheetFile(files[0], state);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleSpreadsheetFile(files[0], state);
    }
  });

  // Toggle colar texto
  btnTogglePaste?.addEventListener('click', () => {
    const isHidden = pasteContainer?.classList.toggle('hidden');
    const chevron = document.getElementById('paste-csv-chevron');
    if (chevron) {
      chevron.setAttribute('data-lucide', isHidden ? 'chevron-down' : 'chevron-up');
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Processar texto colado
  btnParsePasted?.addEventListener('click', () => {
    const rawText = textareaPaste?.value || '';
    if (!rawText.trim()) {
      showToast('Cole as linhas da planilha no campo de texto.', 'warning');
      return;
    }
    parseSpreadsheetText(rawText, state);
  });

  // Confirmar importação em lote
  btnConfirm?.addEventListener('click', () => {
    const selectedRows = getSelectedPreviewRows(state);
    if (selectedRows.length === 0) {
      showToast('Selecione pelo menos uma transação para importar.', 'warning');
      return;
    }

    // Adicionar transações ao estado
    selectedRows.forEach(row => {
      state.transactions.unshift(row);
    });

    onStateChange();
    showToast(`${selectedRows.length} gastos importados com sucesso!`, 'success');

    // Resetar visualização do preview
    resetSpreadsheetPreview();
    document.getElementById('modal-import')?.classList.remove('active');
  });

  // Cancelar preview
  btnCancelPreview?.addEventListener('click', () => {
    resetSpreadsheetPreview();
  });

  // Select all checkbox
  document.getElementById('check-all-parsed')?.addEventListener('change', (e) => {
    const checked = e.target.checked;
    document.querySelectorAll('.check-parsed-row').forEach(cb => {
      cb.checked = checked;
    });
    updatePreviewTotal();
  });
}

function handleSpreadsheetFile(file, state) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    parseSpreadsheetText(content, state, file.name);
  };
  reader.readAsText(file, 'utf-8');
}

export function parseSpreadsheetText(text, state, fileName = '') {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    showToast('Nenhum dado encontrado na planilha.', 'error');
    return;
  }

  const defaultPerson = document.getElementById('import-default-person')?.value || 'Ambos';
  const defaultAccount = document.getElementById('import-default-account')?.value || state.accounts[0]?.id || 'acc_nubank';

  parsedRowsBuffer = [];

  lines.forEach((line, index) => {
    // Detectar delimitador (ponto e vírgula, vírgula ou tab)
    let separator = ';';
    if (line.includes('\t')) separator = '\t';
    else if (line.split(';').length >= 2) separator = ';';
    else if (line.split(',').length >= 2) separator = ',';

    const cols = line.split(separator).map(c => c.trim().replace(/^["']|["']$/g, ''));

    // Pular cabeçalhos comuns (ex: Data; Descricao; Valor)
    const firstColLower = cols[0].toLowerCase();
    if (index === 0 && (firstColLower.includes('data') || firstColLower.includes('date') || firstColLower.includes('dia'))) {
      return;
    }

    const parsed = parseSpreadsheetRow(cols, defaultPerson, defaultAccount, state.categories);
    if (parsed) {
      parsedRowsBuffer.push(parsed);
    }
  });

  if (parsedRowsBuffer.length === 0) {
    showToast('Não foi possível identificar linhas válidas com data e valor.', 'warning');
    return;
  }

  renderSpreadsheetPreview(parsedRowsBuffer, state);
  showToast(`${parsedRowsBuffer.length} lançamentos detectados na planilha!`, 'info');
}

function parseSpreadsheetRow(cols, defaultPerson, defaultAccount, categories) {
  let dateStr = '';
  let desc = '';
  let amount = 0;
  let isExpense = true;

  // Procurar coluna de data
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    // Formatos DD/MM/YYYY ou YYYY-MM-DD
    if (/^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(col)) {
      const parts = col.split(/[/.-]/);
      let day, month, year;
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parts[0]; month = parts[1].padStart(2, '0'); day = parts[2].padStart(2, '0');
      } else {
        // DD/MM/YYYY
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      }
      dateStr = `${year}-${month}-${day}`;
      break;
    }
  }

  // Se não achou data válida, usa a data de hoje
  if (!dateStr) {
    dateStr = new Date().toISOString().split('T')[0];
  }

  // Procurar coluna de valor
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    // Regex de moeda/valor: R$ -150,00 ou -150.00 ou 150,00
    const cleanNumStr = col.replace(/[R$\s]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.');
    const num = parseFloat(cleanNumStr);
    if (!isNaN(num) && Math.abs(num) > 0 && /[\d]+[.,]?\d*/.test(col)) {
      amount = Math.abs(num);
      isExpense = num < 0 || !col.includes('+');
      break;
    }
  }

  if (amount === 0) return null;

  // Descrição: coluna com texto mais longo que não seja data nem valor
  const textCols = cols.filter(c => !/^\d{1,2}[/.-]\d{1,2}/.test(c) && !/^R?\$?\s*[-+]?\d+/.test(c));
  desc = textCols.length > 0 ? textCols.join(' ') : 'Gasto Importado de Planilha';

  // Sugerir categoria e subcategoria inteligente
  const suggestion = suggestCategoryAndSubcategory(desc, isExpense ? 'expense' : 'income', defaultPerson);

  return {
    id: generateId('tx_imp'),
    type: isExpense ? 'expense' : 'income',
    desc: desc.substring(0, 80),
    amount: +amount.toFixed(2),
    categoryId: suggestion.categoryId,
    subcategory: suggestion.subcategory,
    accountId: defaultAccount,
    date: dateStr,
    status: 'paid',
    person: defaultPerson
  };
}

export function suggestCategoryAndSubcategory(desc, type, person = 'Ambos') {
  const d = desc.toLowerCase();

  // Receitas
  if (type === 'income') {
    if (d.includes('diária') || d.includes('diaria')) {
      return { 
        categoryId: person === 'Ju' ? 'cat_diaria_ju' : (person === 'Ozi' ? 'cat_diaria_ozi' : 'cat_freelance'),
        subcategory: 'Diária'
      };
    }
    if (d.includes('salário') || d.includes('salario') || d.includes('folha') || d.includes('remunera')) {
      let sub = 'Salário Mensal';
      if (d.includes('13') || d.includes('décimo')) sub = '13º Salário';
      if (d.includes('férias') || d.includes('ferias')) sub = 'Férias';
      if (d.includes('bônus') || d.includes('bonus') || d.includes('plr')) sub = 'Bônus';
      return { 
        categoryId: person === 'Ju' ? 'cat_salary_ju' : (person === 'Ozi' ? 'cat_salary_ozi' : 'cat_salary_ju'),
        subcategory: sub
      };
    }
    if (d.includes('freela') || d.includes('serviço') || d.includes('projeto') || d.includes('consultoria')) {
      return { categoryId: 'cat_freelance', subcategory: 'Freelance' };
    }
    if (d.includes('rendimento') || d.includes('dividendo') || d.includes('cdb') || d.includes('fii')) {
      let sub = 'Rendimento CDB';
      if (d.includes('dividendo')) sub = 'Dividendos';
      if (d.includes('fii')) sub = 'Lucro FII';
      return { categoryId: 'cat_invest', subcategory: sub };
    }
    return { categoryId: 'cat_salary_ju', subcategory: 'Salário Mensal' };
  }

  // ==================== PRIORIDADES E REGRAS ESPECÍFICAS ====================
  // 11. Impostos
  if (d.includes('imposto') || d.includes('irpf') || d.includes('receita federal') || d.includes('darf') || d.includes('carnê-leão') || d.includes('carne leao')) {
    return { categoryId: 'cat_taxes', subcategory: 'Imposto de Renda' };
  }

  // 8. Pet (Verificado antes de saúde humana para veterinário, petz, etc.)
  if (d.includes('ração') || d.includes('racao') || d.includes('petisco') || d.includes('sache') || d.includes('sachê')) {
    return { categoryId: 'cat_pet', subcategory: 'Ração' };
  }
  if (d.includes('veterinário') || d.includes('veterinario') || d.includes('vet ') || d.startsWith('vet') || d.includes('hospital pet') || d.includes('clinica pet')) {
    return { categoryId: 'cat_pet', subcategory: 'Veterinário' };
  }
  if (d.includes('vacina pet') || d.includes('v8') || d.includes('v10') || (d.includes('vacina') && (d.includes('pet') || d.includes('gato') || d.includes('cao') || d.includes('cão')))) {
    return { categoryId: 'cat_pet', subcategory: 'Vacinas' };
  }
  if (d.includes('remedio pet') || d.includes('antipulgas') || d.includes('vermifugo') || d.includes('bravecto') || d.includes('simparic')) {
    return { categoryId: 'cat_pet', subcategory: 'Medicamentos' };
  }
  if (d.includes('banho e tosa') || d.includes('tosa') || d.includes('banho pet')) {
    return { categoryId: 'cat_pet', subcategory: 'Banho e Tosa' };
  }
  if (d.includes('brinquedo pet') || d.includes('arranhador') || d.includes('bolinha')) {
    return { categoryId: 'cat_pet', subcategory: 'Brinquedos' };
  }
  if (d.includes('creche pet') || d.includes('hotel pet') || d.includes('doghero')) {
    return { categoryId: 'cat_pet', subcategory: 'Creche e Hotel' };
  }
  if (d.includes('petz') || d.includes('cobasi') || d.includes('pet ') || d.includes('coleira') || d.includes('guia') || d.includes('caminha')) {
    return { categoryId: 'cat_pet', subcategory: 'Acessórios' };
  }

  // 1. Transporte
  if (d.includes('combustivel') || d.includes('combustível') || d.includes('gasolina') || d.includes('etanol') || d.includes('diesel') || (d.includes('posto') && !d.includes('imposto')) || d.includes('ipiranga') || d.includes('shell') || d.includes('petrobras')) {
    return { categoryId: 'cat_transport', subcategory: 'Combustível' };
  }
  if (d.includes('parcela carro') || d.includes('financiamento carro') || d.includes('carro parcela')) {
    return { categoryId: 'cat_transport', subcategory: 'Parcela Carro' };
  }
  if (d.includes('estacionamento') || d.includes('estapar') || d.includes('zona azul') || d.includes('valet')) {
    return { categoryId: 'cat_transport', subcategory: 'Estacionamento' };
  }
  if (d.includes('manutenção preventiva') || d.includes('revisao') || d.includes('revisão') || d.includes('troca de oleo') || d.includes('troca de óleo')) {
    return { categoryId: 'cat_transport', subcategory: 'Manutenção Preventiva' };
  }
  if (d.includes('manutenção corretiva') || d.includes('mecanico') || d.includes('mecânico') || d.includes('oficina') || d.includes('funilaria') || d.includes('guincho')) {
    return { categoryId: 'cat_transport', subcategory: 'Manutenção Corretiva' };
  }
  if (d.includes('lavagem') || d.includes('lava rapido') || d.includes('lava jato') || d.includes('estetica automotiva')) {
    return { categoryId: 'cat_transport', subcategory: 'Lavagem' };
  }
  if (d.includes('uber') || d.includes('99') || d.includes('cabify') || d.includes('táxi') || d.includes('taxi')) {
    return { categoryId: 'cat_transport', subcategory: 'Uber' };
  }
  if (d.includes('multa') || d.includes('detran') || d.includes('radar')) {
    return { categoryId: 'cat_transport', subcategory: 'Multa' };
  }
  if (d.includes('seguro auto') || d.includes('seguro carro') || d.includes('porto seguro')) {
    return { categoryId: 'cat_transport', subcategory: 'Seguro' };
  }
  if (d.includes('ipva')) {
    return { categoryId: 'cat_transport', subcategory: 'IPVA' };
  }
  if (d.includes('licenciamento') || d.includes('dpvat')) {
    return { categoryId: 'cat_transport', subcategory: 'Licenciamento' };
  }

  // 2. Vestuário e Imagem
  if (d.includes('roupa') || d.includes('zara') || d.includes('renner') || d.includes('c&a') || d.includes('shein') || d.includes('riachuelo') || d.includes('vestido') || d.includes('camisa') || d.includes('calça')) {
    return { categoryId: 'cat_clothing_image', subcategory: 'Roupas' };
  }
  if (d.includes('calçado') || d.includes('calcado') || d.includes('sapato') || d.includes('tenis') || d.includes('tênis') || d.includes('sandalia') || d.includes('arezz')) {
    return { categoryId: 'cat_clothing_image', subcategory: 'Calçados' };
  }
  if (d.includes('acessório') || d.includes('acessorio') || d.includes('bolsa') || d.includes('joia') || d.includes('óculos') || d.includes('oculos') || d.includes('relogio')) {
    return { categoryId: 'cat_clothing_image', subcategory: 'Acessórios' };
  }
  if (d.includes('salão') || d.includes('salao') || d.includes('cabeleireiro') || d.includes('barbearia') || d.includes('corte de cabelo') || d.includes('manicure') || d.includes('unha')) {
    return { categoryId: 'cat_clothing_image', subcategory: 'Salão' };
  }
  if (d.includes('estética') || d.includes('estetica') || d.includes('depilação') || d.includes('limpeza de pele') || d.includes('botox')) {
    return { categoryId: 'cat_clothing_image', subcategory: 'Estética' };
  }
  if (d.includes('cosmético') || d.includes('cosmetico') || d.includes('boticario') || d.includes('boticário') || d.includes('natura') || d.includes('sephora') || d.includes('maquiagem') || d.includes('perfume') || d.includes('creme')) {
    return { categoryId: 'cat_clothing_image', subcategory: 'Cosméticos' };
  }

  // 3. Alimentação
  if (d.includes('mercado') || d.includes('supermercado') || d.includes('carrefour') || d.includes('pão de açúcar') || d.includes('pao de acucar') || d.includes('atacadao') || d.includes('atacadão') || d.includes('assai') || d.includes('assaí') || d.includes('sams club') || d.includes('mambo') || d.includes('hipermercado')) {
    return { categoryId: 'cat_food', subcategory: 'Mercado' };
  }
  if (d.includes('feira') || d.includes('hortifruti') || d.includes('sacolão') || d.includes('sacolao') || d.includes('frutas') || d.includes('verduras')) {
    return { categoryId: 'cat_food', subcategory: 'Feira' };
  }
  if (d.includes('açougue') || d.includes('acougue') || d.includes('casa de carnes') || d.includes('swift') || d.includes('carnes')) {
    return { categoryId: 'cat_food', subcategory: 'Açougue' };
  }
  if (d.includes('delivery') || d.includes('ifood') || d.includes('rappi') || d.includes('pedir comida') || d.includes('entrega comida')) {
    return { categoryId: 'cat_food', subcategory: 'Delivery' };
  }

  // 4. Moradia
  if (d.includes('aluguel') || d.includes('locação') || d.includes('quinto andar') || d.includes('imobiliaria')) {
    return { categoryId: 'cat_housing', subcategory: 'Aluguel' };
  }
  if (d.includes('condomínio') || d.includes('condominio') || d.includes('taxa condominial')) {
    return { categoryId: 'cat_housing', subcategory: 'Condomínio' };
  }
  if (d.includes('iptu') || d.includes('prefeitura iptu')) {
    return { categoryId: 'cat_housing', subcategory: 'IPTU' };
  }
  if (d.includes('água') || d.includes('agua') || d.includes('sabesp') || d.includes('sanepar') || d.includes('copasa') || d.includes('caesb')) {
    return { categoryId: 'cat_housing', subcategory: 'Água' };
  }
  if (d.includes('gás') || d.includes('gas') || d.includes('ultragaz') || d.includes('comgas') || d.includes('liquigas') || d.includes('botijao')) {
    return { categoryId: 'cat_housing', subcategory: 'Gás' };
  }
  if (d.includes('luz') || d.includes('enel') || d.includes('cpfl') || d.includes('cemig') || d.includes('energisa') || d.includes('eletropaulo') || d.includes('eletricidade') || d.includes('energia')) {
    return { categoryId: 'cat_housing', subcategory: 'Luz' };
  }
  if (d.includes('internet residencial') || d.includes('fibra') || d.includes('claro net') || d.includes('vivo fibra') || d.includes('oi fibra')) {
    return { categoryId: 'cat_housing', subcategory: 'Internet residencial' };
  }
  if (d.includes('manutenção da casa') || d.includes('manutencao da casa') || d.includes('diarista') || d.includes('faxina') || d.includes('pintura') || d.includes('chaveiro')) {
    return { categoryId: 'cat_housing', subcategory: 'Manutenção da casa' };
  }
  if (d.includes('reparos emergenciais') || d.includes('encanador') || d.includes('eletricista') || d.includes('desentupidora') || d.includes('vazamento')) {
    return { categoryId: 'cat_housing', subcategory: 'Reparos Emergenciais' };
  }
  if (d.includes('móveis') || d.includes('moveis') || d.includes('eletrodomésticos') || d.includes('eletro') || d.includes('leroy') || d.includes('tok&stok') || d.includes('camicado') || d.includes('geladeira') || d.includes('fogão') || d.includes('sofa') || d.includes('sofá') || d.includes('cama')) {
    return { categoryId: 'cat_housing', subcategory: 'Móveis e eletrodomésticos' };
  }

  // 5. Lazer
  if (d.includes('celebração') || d.includes('celebracao') || d.includes('festa') || d.includes('aniversario') || d.includes('aniversário') || d.includes('comemoração')) {
    return { categoryId: 'cat_leisure', subcategory: 'Celebrações' };
  }
  if (d.includes('presente') || d.includes('lembrancinha')) {
    return { categoryId: 'cat_leisure', subcategory: 'Presentes' };
  }
  if (d.includes('bar') || d.includes('pub') || d.includes('boteco') || d.includes('choperia') || d.includes('cerveja')) {
    return { categoryId: 'cat_leisure', subcategory: 'Bares' };
  }
  if (d.includes('cinema') || d.includes('cinemark') || d.includes('uci') || d.includes('kinoplex') || d.includes('pipoca')) {
    return { categoryId: 'cat_leisure', subcategory: 'Cinema' };
  }
  if (d.includes('show') || d.includes('teatro') || d.includes('ingresso') || d.includes('eventim') || d.includes('sympla')) {
    return { categoryId: 'cat_leisure', subcategory: 'Show' };
  }
  if (d.includes('passeio') || d.includes('parque') || d.includes('museu') || d.includes('zoologico') || d.includes('aquario')) {
    return { categoryId: 'cat_leisure', subcategory: 'Passeios' };
  }
  if (d.includes('viagem') || d.includes('hotel') || d.includes('airbnb') || d.includes('passagem') || d.includes('decolar') || d.includes('booking') || d.includes('voo') || d.includes('latam') || d.includes('gol')) {
    return { categoryId: 'cat_leisure', subcategory: 'Viagem' };
  }
  if (d.includes('cafeteria') || d.includes('café') || d.includes('cafe') || d.includes('starbucks') || d.includes('padaria') || d.includes('restaurante') || d.includes('almoço') || d.includes('jantar')) {
    return { categoryId: 'cat_leisure', subcategory: 'Cafeteria' };
  }

  // 6. Saúde
  if (d.includes('plano de saúde') || d.includes('plano de saude') || d.includes('unimed') || d.includes('sulamerica') || d.includes('bradesco saude') || d.includes('amil') || d.includes('notredame')) {
    return { categoryId: 'cat_health', subcategory: 'Plano de Saúde' };
  }
  if (d.includes('consulta') || d.includes('médico') || d.includes('medico') || d.includes('clinica') || d.includes('hospital')) {
    return { categoryId: 'cat_health', subcategory: 'Consultas Médicas' };
  }
  if (d.includes('terapia') || d.includes('psicolog') || d.includes('psicoterapia') || d.includes('psiquiatr')) {
    return { categoryId: 'cat_health', subcategory: 'Terapia' };
  }
  if (d.includes('medicamento') || d.includes('farmacia') || d.includes('farmácia') || d.includes('droga') || d.includes('drogasil') || d.includes('droga raia') || d.includes('pacheco') || d.includes('sao paulo')) {
    return { categoryId: 'cat_health', subcategory: 'Medicamentos' };
  }
  if (d.includes('exame') || d.includes('laboratorio') || d.includes('fleury') || d.includes('dasa') || d.includes('lavoisier') || d.includes('ressonancia') || d.includes('sangue')) {
    return { categoryId: 'cat_health', subcategory: 'Exames' };
  }
  if (d.includes('odonto') || d.includes('dentista') || d.includes('dente') || d.includes('aparelho')) {
    return { categoryId: 'cat_health', subcategory: 'Odontologista' };
  }
  if (d.includes('academia') || d.includes('smartfit') || d.includes('bluefit') || d.includes('gympass') || d.includes('totalpass') || d.includes('personal') || d.includes('crossfit') || d.includes('pilates')) {
    return { categoryId: 'cat_health', subcategory: 'Academia' };
  }
  if (d.includes('massagem') || d.includes('quiropraxia') || d.includes('spa')) {
    return { categoryId: 'cat_health', subcategory: 'Massagens' };
  }

  // 7. Educação
  if (d.includes('nova acrópole') || d.includes('nova acropole') || d.includes('acropole')) {
    return { categoryId: 'cat_education', subcategory: 'Nova Acrópole' };
  }
  if (d.includes('curso') || d.includes('udemy') || d.includes('alura') || d.includes('coursera') || d.includes('escola') || d.includes('faculdade') || d.includes('pos-graduacao') || d.includes('pós')) {
    return { categoryId: 'cat_education', subcategory: 'Cursos' };
  }
  if (d.includes('livro') || d.includes('livraria') || d.includes('kindle') || d.includes('saraiva')) {
    return { categoryId: 'cat_education', subcategory: 'Livros' };
  }
  if (d.includes('palestra') || d.includes('seminario') || d.includes('workshop')) {
    return { categoryId: 'cat_education', subcategory: 'Palestras' };
  }
  if (d.includes('mentoria') || d.includes('coaching')) {
    return { categoryId: 'cat_education', subcategory: 'Mentorias' };
  }
  if (d.includes('assinatura educacional') || d.includes('duolingo') || d.includes('medium')) {
    return { categoryId: 'cat_education', subcategory: 'Assinatura Educacional' };
  }

  // 9. Streaming
  if (d.includes('netflix')) {
    return { categoryId: 'cat_streaming', subcategory: 'Netflix' };
  }
  if (d.includes('spotify') || d.includes('deezer') || d.includes('apple music')) {
    return { categoryId: 'cat_streaming', subcategory: 'Spotify' };
  }
  if (d.includes('prime') || d.includes('amazon prime') || d.includes('disney') || d.includes('hbo') || d.includes('max') || d.includes('youtube premium') || d.includes('globoplay')) {
    return { categoryId: 'cat_streaming', subcategory: 'Amazon Prime' };
  }

  // 10. Telefonia
  if (d.includes('cel ju') || (d.includes('ju') && (d.includes('celular') || d.includes('recarga') || d.includes('plano celular')))) {
    return { categoryId: 'cat_telephony', subcategory: 'Cel Ju' };
  }
  if (d.includes('cel ozi') || (d.includes('ozi') && (d.includes('celular') || d.includes('recarga') || d.includes('plano celular')))) {
    return { categoryId: 'cat_telephony', subcategory: 'Cel Ozi' };
  }
  if (d.includes('vivo') || d.includes('claro') || d.includes('tim') || d.includes('celular') || d.includes('recarga')) {
    return { categoryId: 'cat_telephony', subcategory: person === 'Ju' ? 'Cel Ju' : (person === 'Ozi' ? 'Cel Ozi' : 'Cel Ju') };
  }

  // 12. Taxas
  if (d.includes('tarifa') || d.includes('tarifa bancária') || d.includes('ted') || d.includes('doc') || d.includes('taxa saque')) {
    return { categoryId: 'cat_fees', subcategory: 'Tarifa Bancária' };
  }
  if (d.includes('anuidade') || d.includes('anuidade cartão')) {
    return { categoryId: 'cat_fees', subcategory: 'Anuidade Cartão' };
  }
  if (d.includes('juros') || d.includes('iof') || d.includes('multa atraso') || d.includes('encargos')) {
    return { categoryId: 'cat_fees', subcategory: 'Juros' };
  }
  if (d.includes('manutenção conta') || d.includes('pacote de servicos') || d.includes('manutencao conta')) {
    return { categoryId: 'cat_fees', subcategory: 'Manutenção Conta' };
  }

  // 13. Investimentos
  if (d.includes('ações') || d.includes('acoes') || d.includes('b3') || d.includes('nuinvest') || d.includes('xp') || d.includes('clear')) {
    return { categoryId: 'cat_invest_expense', subcategory: 'Ações' };
  }
  if (d.includes('fii') || d.includes('fundos imobiliarios') || d.includes('fundo imobiliario')) {
    return { categoryId: 'cat_invest_expense', subcategory: 'FIIs' };
  }
  if (d.includes('renda fixa') || d.includes('cdb') || d.includes('lci') || d.includes('lca') || d.includes('tesouro direto') || d.includes('poupanca') || d.includes('poupança')) {
    return { categoryId: 'cat_invest_expense', subcategory: 'Renda Fixa' };
  }
  if (d.includes('meta ju e ozi') || d.includes('meta casal') || d.includes('investimento casal') || d.includes('reserva')) {
    return { categoryId: 'cat_invest_expense', subcategory: 'Meta Ju e Ozi' };
  }

  // 14. Jardinagem
  if (d.includes('muda') || d.includes('planta') || d.includes('vaso')) {
    return { categoryId: 'cat_gardening', subcategory: 'Mudas' };
  }
  if (d.includes('terra') || d.includes('adubo') || d.includes('substrato')) {
    return { categoryId: 'cat_gardening', subcategory: 'Terra' };
  }
  if (d.includes('equipamento jardim') || d.includes('mangueira') || d.includes('tesoura de poda') || d.includes('regador')) {
    return { categoryId: 'cat_gardening', subcategory: 'Equipamentos' };
  }
  if (d.includes('semente') || d.includes('sementes')) {
    return { categoryId: 'cat_gardening', subcategory: 'Sementes' };
  }
  if (d.includes('flor') || d.includes('flores') || d.includes('floricultura') || d.includes('jardim')) {
    return { categoryId: 'cat_gardening', subcategory: 'Flores' };
  }

  // 15. Outros
  if (d.includes('doação') || d.includes('doacao') || d.includes('dízimo') || d.includes('dizimo') || d.includes('caridade')) {
    return { categoryId: 'cat_other', subcategory: 'Doação' };
  }
  if (d.includes('extra') || d.includes('diversos')) {
    return { categoryId: 'cat_other', subcategory: 'Extras' };
  }

  return { categoryId: 'cat_other', subcategory: 'Extras' };
}

export function suggestCategoryFromDesc(desc, type, person = 'Ambos') {
  return suggestCategoryAndSubcategory(desc, type, person).categoryId;
}

function renderSpreadsheetPreview(rows, state) {
  const wrapper = document.getElementById('spreadsheet-preview-wrapper');
  const tbody = document.getElementById('parsed-spreadsheet-body');
  const countEl = document.getElementById('parsed-tx-count');

  if (!wrapper || !tbody) return;
  wrapper.classList.remove('hidden');

  if (countEl) countEl.textContent = rows.length;

  const catOptions = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  tbody.innerHTML = rows.map((row, idx) => `
    <tr data-index="${idx}">
      <td>
        <input type="checkbox" class="check-parsed-row" data-index="${idx}" checked>
      </td>
      <td>
        <input type="date" value="${row.date}" class="form-input row-date" style="padding: 4px 6px; font-size: 0.8rem; width: 130px;">
      </td>
      <td>
        <input type="text" value="${row.desc}" class="form-input row-desc" style="padding: 4px 8px; font-size: 0.85rem; min-width: 180px;">
      </td>
      <td>
        <select class="custom-select row-person" style="padding: 4px 6px; font-size: 0.8rem; width: 100px;">
          <option value="Ambos" ${row.person === 'Ambos' ? 'selected' : ''}>👥 Ambos</option>
          <option value="Ju" ${row.person === 'Ju' ? 'selected' : ''}>👩 Ju</option>
          <option value="Ozi" ${row.person === 'Ozi' ? 'selected' : ''}>👩 Ozi</option>
        </select>
      </td>
      <td>
        <select class="custom-select row-cat" style="padding: 4px 6px; font-size: 0.8rem; width: 160px;">
          ${state.categories.map(c => `<option value="${c.id}" ${c.id === row.categoryId ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </td>
      <td class="text-right">
        <input type="number" step="0.01" value="${row.amount}" class="form-input text-right row-amount font-mono font-bold ${row.type === 'income' ? 'text-success' : 'text-danger'}" style="padding: 4px 8px; font-size: 0.85rem; width: 110px;">
      </td>
    </tr>
  `).join('');

  // Listeners para checkboxes individuais
  tbody.querySelectorAll('.check-parsed-row').forEach(cb => {
    cb.addEventListener('change', updatePreviewTotal);
  });

  tbody.querySelectorAll('.row-amount').forEach(inp => {
    inp.addEventListener('input', updatePreviewTotal);
  });

  updatePreviewTotal();
  if (window.lucide) window.lucide.createIcons();
}

function updatePreviewTotal() {
  const tbody = document.getElementById('parsed-spreadsheet-body');
  const totalEl = document.getElementById('parsed-tx-total');
  const btnLabel = document.getElementById('btn-confirm-import-label');
  if (!tbody) return;

  let total = 0;
  let count = 0;

  tbody.querySelectorAll('tr').forEach(tr => {
    const cb = tr.querySelector('.check-parsed-row');
    if (cb && cb.checked) {
      const amtInp = tr.querySelector('.row-amount');
      const val = parseFloat(amtInp?.value || 0);
      if (!isNaN(val)) total += val;
      count++;
    }
  });

  if (totalEl) totalEl.textContent = formatCurrency(total);
  if (btnLabel) btnLabel.textContent = `Confirmar Importação de ${count} Lançamento${count !== 1 ? 's' : ''}`;
}

function getSelectedPreviewRows(state) {
  const tbody = document.getElementById('parsed-spreadsheet-body');
  if (!tbody) return [];

  const defaultAccount = document.getElementById('import-default-account')?.value || state.accounts[0]?.id || 'acc_nubank';
  const selected = [];

  tbody.querySelectorAll('tr').forEach(tr => {
    const cb = tr.querySelector('.check-parsed-row');
    if (cb && cb.checked) {
      const date = tr.querySelector('.row-date')?.value || new Date().toISOString().split('T')[0];
      const desc = tr.querySelector('.row-desc')?.value || 'Gasto Importado';
      const person = tr.querySelector('.row-person')?.value || 'Ambos';
      const categoryId = tr.querySelector('.row-cat')?.value || 'cat_food';
      const amount = parseFloat(tr.querySelector('.row-amount')?.value || 0);

      selected.push({
        id: generateId('tx_imp'),
        type: 'expense',
        desc,
        amount: Math.abs(amount),
        categoryId,
        accountId: defaultAccount,
        date,
        status: 'paid',
        person
      });
    }
  });

  return selected;
}

function resetSpreadsheetPreview() {
  parsedRowsBuffer = [];
  document.getElementById('spreadsheet-preview-wrapper')?.classList.add('hidden');
  const input = document.getElementById('input-spreadsheet-file');
  if (input) input.value = '';
  const textarea = document.getElementById('textarea-paste-csv');
  if (textarea) textarea.value = '';
}
