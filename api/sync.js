export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // Verificar se o banco de dados Postgres foi conectado no painel da Vercel
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL) {
    return res.status(200).json({
      success: true,
      postgresConnected: false,
      message: 'Vercel Postgres ainda não conectado nas variáveis de ambiente.'
    });
  }

  try {
    const { sql } = await import('@vercel/postgres');
    const { action, item, id } = req.body || {};

    switch (action) {
      // ==================== TRANSAÇÕES ====================
      case 'save_transaction': {
        const tx = item;
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
        return res.status(200).json({ success: true, message: 'Transação salva no Postgres!' });
      }

      case 'delete_transaction': {
        const targetId = id || item?.id;
        await sql`DELETE FROM transactions WHERE id = ${targetId};`;
        return res.status(200).json({ success: true, message: 'Transação excluída do Postgres!' });
      }

      // ==================== ORÇAMENTOS ====================
      case 'save_budget': {
        const b = item;
        await sql`
          INSERT INTO budgets (id, category_id, limit_amount)
          VALUES (${b.id}, ${b.categoryId}, ${b.limit})
          ON CONFLICT (id) DO UPDATE SET
            category_id = EXCLUDED.category_id,
            limit_amount = EXCLUDED.limit_amount;
        `;
        return res.status(200).json({ success: true, message: 'Orçamento salvo no Postgres!' });
      }

      case 'delete_budget': {
        const targetId = id || item?.id;
        await sql`DELETE FROM budgets WHERE id = ${targetId};`;
        return res.status(200).json({ success: true, message: 'Orçamento excluído do Postgres!' });
      }

      // ==================== METAS ====================
      case 'save_goal': {
        const g = item;
        await sql`
          INSERT INTO goals (id, name, target, current, deadline, icon)
          VALUES (${g.id}, ${g.name}, ${g.target}, ${g.current || 0}, ${g.deadline}, ${g.icon || 'target'})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            target = EXCLUDED.target,
            current = EXCLUDED.current,
            deadline = EXCLUDED.deadline,
            icon = EXCLUDED.icon;
        `;
        return res.status(200).json({ success: true, message: 'Meta salva no Postgres!' });
      }

      case 'delete_goal': {
        const targetId = id || item?.id;
        await sql`DELETE FROM goals WHERE id = ${targetId};`;
        return res.status(200).json({ success: true, message: 'Meta excluída do Postgres!' });
      }

      // ==================== CONTAS ====================
      case 'save_account': {
        const a = item;
        await sql`
          INSERT INTO accounts (id, name, type, initial_balance, color)
          VALUES (${a.id}, ${a.name}, ${a.type}, ${a.initialBalance || 0}, ${a.color})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            initial_balance = EXCLUDED.initial_balance,
            color = EXCLUDED.color;
        `;
        return res.status(200).json({ success: true, message: 'Conta salva no Postgres!' });
      }

      // ==================== RECORRENTES ====================
      case 'save_recurring': {
        const r = item;
        await sql`
          INSERT INTO recurring (id, title, amount, type, due_day, category_id, account_id, person)
          VALUES (${r.id}, ${r.title}, ${r.amount}, ${r.type}, ${r.dueDay}, ${r.categoryId}, ${r.accountId}, ${r.person || 'Ambos'})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            amount = EXCLUDED.amount,
            type = EXCLUDED.type,
            due_day = EXCLUDED.due_day,
            category_id = EXCLUDED.category_id,
            account_id = EXCLUDED.account_id,
            person = EXCLUDED.person;
        `;
        return res.status(200).json({ success: true, message: 'Recorrente salvo no Postgres!' });
      }

      case 'delete_recurring': {
        const targetId = id || item?.id;
        await sql`DELETE FROM recurring WHERE id = ${targetId};`;
        return res.status(200).json({ success: true, message: 'Recorrente excluído do Postgres!' });
      }

      // ==================== INVESTIMENTOS ====================
      case 'save_investment': {
        const inv = item;
        await sql`
          INSERT INTO investments (id, type, name, institution, amount, date, return_rate)
          VALUES (${inv.id}, ${inv.type}, ${inv.name}, ${inv.institution}, ${inv.amount}, ${inv.date}, ${inv.returnRate})
          ON CONFLICT (id) DO UPDATE SET
            type = EXCLUDED.type,
            name = EXCLUDED.name,
            institution = EXCLUDED.institution,
            amount = EXCLUDED.amount,
            date = EXCLUDED.date,
            return_rate = EXCLUDED.return_rate;
        `;
        return res.status(200).json({ success: true, message: 'Investimento salvo no Postgres!' });
      }

      case 'delete_investment': {
        const targetId = id || item?.id;
        await sql`DELETE FROM investments WHERE id = ${targetId};`;
        return res.status(200).json({ success: true, message: 'Investimento excluído do Postgres!' });
      }

      default:
        return res.status(400).json({ error: `Ação desconhecida: ${action}` });
    }
  } catch (error) {
    console.error('Erro no /api/sync:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
