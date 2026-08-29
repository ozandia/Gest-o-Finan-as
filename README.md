# Gestão Financeira - Sistema Inteligente de Controle Pessoal 💰

**Gestão Financeira** é uma aplicação web moderna, responsiva e completa para controle financeiro pessoal e empresarial, desenvolvida com foco em alta performance, privacidade total dos dados (armazenamento local) e design premium estilo fintech (Dark Mode & Light Mode).

---

## ✨ Funcionalidades Principais

1. **Dashboard & KPIs em Tempo Real**:
   - Saldo consolidado de todas as contas bancárias e carteiras.
   - Receitas recebidas e a receber no período.
   - Despesas pagas e a vencer.
   - Taxa de economia (% poupada) e comparativo de evolução com o mês anterior.
   - Gráfico de Fluxo de Caixa mensal interativo (6 ou 12 meses).
   - Gráfico donut de distribuição de gastos por categoria.

2. **Gerenciamento Completo de Transações**:
   - Lançamento rápido de **Receitas**, **Despesas** e **Transferências**.
   - Suporte a **parcelamento automático** (ex: 3x, 6x, 12x com cálculo de parcelas mensais).
   - Status de pagamento: **Pago** vs **Pendente / Agendado** com alternância em 1 clique.
   - Filtros instantâneos por tipo, categoria, conta, status e busca por texto/valor.
   - Paginação e resumo consolidado do total filtrado.
   - Exportação do extrato para arquivo **CSV / Excel**.

3. **Planejamento de Orçamentos Mensais (Budgets)**:
   - Estipulação de limites mensais de gastos por categoria.
   - Barras de progresso dinâmicas com código de cores:
     - 🟢 **Seguro** (< 75%)
     - 🟡 **Atenção** (75% a 100%)
     - 🔴 **Excedido / Estourado** (> 100%)

4. **Metas Financeiras & Cofres (Goals & Dreams)**:
   - Definição de objetivos com data limite, valor alvo e valor acumulado.
   - Barra de progresso visual de conquista.
   - Botão rápido de **"Guardar Dinheiro"** (aporte direto com débito em conta).

5. **Contas Bancárias & Cartões**:
   - Suporte a Múltiplas Contas (Conta Corrente, Poupança, Cartão de Crédito, Carteira Física, Investimentos).
   - Saldo atualizado automaticamente em tempo real com base nos lançamentos pagos.

6. **Relatórios & DRE Simplificado**:
   - Demonstrativo do Resultado do Exercício pessoal (Receitas Fixas/Extras vs Despesas Essenciais/Estilo de Vida).
   - Ranking das categorias com maior consumo de recursos.
   - Modo de visualização pronto para impressão (`Ctrl + P`).

7. **Privacidade, Backup & Segurança**:
   - Botão de ocultar/exibir valores financeiros na tela (Modo Privacidade).
   - Exportação e restauração de **Backup completo em arquivo JSON**.
   - Carregamento de dados de demonstração ou zeramento dos dados com 1 clique.

---

## 🚀 Como Executar Localmente

Você pode iniciar o servidor local com o Node.js:

```bash
cd "C:\Users\Admin\.gemini\antigravity-ide\scratch\controle-financas"
node server.js
```

Em seguida, abra o seu navegador de preferência e acesse:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ⌨️ Atalhos de Teclado
- `N` : Abrir modal de Nova Transação instantaneamente.
- `Esc` : Fechar qualquer modal ativo.
