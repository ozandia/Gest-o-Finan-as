import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from './init.js';

export default async function handler(req, res) {
  // CORS Headers para requisições
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar se o banco de dados Postgres foi conectado no painel da Vercel
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL) {
    return res.status(200).json({
      success: true,
      postgresConnected: false,
      message: 'Vercel Postgres ainda não conectado nas variáveis de ambiente.',
      data: {
        transactions: [],
        categories: DEFAULT_CATEGORIES,
        accounts: DEFAULT_ACCOUNTS,
        budgets: [],
        goals: [],
        recurring: [],
        investments: []
      }
    });
  }

  const { sql } = await import('@vercel/postgres');

  if (req.method === 'GET') {
    try {
      // 1. Verificar se tabelas existem buscando categorias
      let catResult;
      try {
        catResult = await sql`SELECT * FROM categories;`;
      } catch (err) {
        // Tabelas ainda não foram criadas, acionar criação básica
        return res.status(200).json({
          success: true,
          initialized: false,
          data: {
            transactions: [],
            categories: DEFAULT_CATEGORIES,
            accounts: DEFAULT_ACCOUNTS,
            budgets: [],
            goals: [],
            recurring: [],
            investments: []
          }
        });
      }

      // Se categorias estiverem vazias, usar padrão
      let categories = catResult.rows.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        icon: r.icon,
        color: r.color,
        essential: r.essential,
        member: r.member,
        subcategories: typeof r.subcategories === 'string' ? JSON.parse(r.subcategories) : (r.subcategories || [])
      }));

      if (categories.length === 0) {
        categories = DEFAULT_CATEGORIES;
      }

      // 2. Buscar Contas
      const accResult = await sql`SELECT * FROM accounts;`;
      let accounts = accResult.rows.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        initialBalance: parseFloat(r.initial_balance || 0),
        color: r.color
      }));

      if (accounts.length === 0) {
        accounts = DEFAULT_ACCOUNTS;
      }

      // 3. Buscar Transações
      const txResult = await sql`SELECT * FROM transactions ORDER BY date DESC, created_at DESC;`;
      const transactions = txResult.rows.map(r => ({
        id: r.id,
        type: r.type,
        desc: r.description,
        amount: parseFloat(r.amount || 0),
        categoryId: r.category_id,
        subcategory: r.subcategory || null,
        accountId: r.account_id,
        destAccountId: r.dest_account_id || null,
        date: r.date,
        status: r.status,
        person: r.person,
        installmentGroupId: r.installment_group_id || null,
        installmentIndex: r.installment_index || null,
        installmentTotal: r.installment_total || null
      }));

      // 4. Buscar Orçamentos
      const budgetResult = await sql`SELECT * FROM budgets;`;
      const budgets = budgetResult.rows.map(r => ({
        id: r.id,
        categoryId: r.category_id,
        limit: parseFloat(r.limit_amount || 0)
      }));

      // 5. Buscar Metas
      const goalResult = await sql`SELECT * FROM goals;`;
      const goals = goalResult.rows.map(r => ({
        id: r.id,
        name: r.name,
        target: parseFloat(r.target || 0),
        current: parseFloat(r.current || 0),
        deadline: r.deadline,
        icon: r.icon
      }));

      // 6. Buscar Recorrentes
      const recResult = await sql`SELECT * FROM recurring;`;
      const recurring = recResult.rows.map(r => ({
        id: r.id,
        title: r.title,
        amount: parseFloat(r.amount || 0),
        type: r.type,
        dueDay: r.due_day,
        categoryId: r.category_id,
        accountId: r.account_id,
        person: r.person
      }));

      // 7. Buscar Investimentos
      const invResult = await sql`SELECT * FROM investments;`;
      const investments = invResult.rows.map(r => ({
        id: r.id,
        type: r.type,
        name: r.name,
        institution: r.institution,
        amount: parseFloat(r.amount || 0),
        date: r.date,
        returnRate: r.return_rate
      }));

      return res.status(200).json({
        success: true,
        initialized: true,
        data: {
          transactions,
          categories,
          accounts,
          budgets,
          goals,
          recurring,
          investments
        }
      });
    } catch (error) {
      console.error('Erro ao ler estado do Vercel Postgres:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao carregar dados do banco.'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { transactions, budgets, goals, recurring, investments } = req.body || {};

      // Sincronização em lote de transações
      if (Array.isArray(transactions)) {
        for (const tx of transactions) {
          await sql`
            INSERT INTO transactions (
              id, type, description, amount, category_id, subcategory, account_id, dest_account_id, date, status, person, installment_group_id, installment_index, installment_total
            ) VALUES (
              ${tx.id}, ${tx.type}, ${tx.desc}, ${tx.amount}, ${tx.categoryId}, ${tx.subcategory || null}, ${tx.accountId}, ${tx.destAccountId || null}, ${tx.date}, ${tx.status}, ${tx.person || 'Ambos'}, ${tx.installmentGroupId || null}, ${tx.installmentIndex || null}, ${tx.installmentTotal || null}
            )
            ON CONFLICT (id) DO UPDATE SET
              type = EXCLUDED.type,
              description = EXCLUDED.description,
              amount = EXCLUDED.amount,
              category_id = EXCLUDED.category_id,
              subcategory = EXCLUDED.subcategory,
              account_id = EXCLUDED.account_id,
              dest_account_id = EXCLUDED.dest_account_id,
              date = EXCLUDED.date,
              status = EXCLUDED.status,
              person = EXCLUDED.person;
          `;
        }
      }

      return res.status(200).json({ success: true, message: 'Estado sincronizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar estado no Vercel Postgres:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
