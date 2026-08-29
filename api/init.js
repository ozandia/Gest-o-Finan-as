export const DEFAULT_ACCOUNTS = [
  { id: 'acc_c6', name: 'C6 Bank', type: 'checking', initial_balance: 0.00, color: '#27272a' },
  { id: 'acc_mercadopago', name: 'Mercado Pago', type: 'checking', initial_balance: 0.00, color: '#0284c7' },
  { id: 'acc_nubank', name: 'Nubank', type: 'checking', initial_balance: 0.00, color: '#8b5cf6' }
];

export const DEFAULT_CATEGORIES = [
  // Receitas Ju
  { id: 'cat_salary_ju', name: 'Salário (Ju)', type: 'income', icon: 'briefcase', color: '#ec4899', essential: false, member: 'Ju', subcategories: ['Salário Mensal', '13º Salário', 'Férias', 'Bônus'] },
  { id: 'cat_diaria_ju', name: 'Diárias de Trabalho (Ju)', type: 'income', icon: 'calendar-check', color: '#f43f5e', essential: false, member: 'Ju', subcategories: ['Diária', 'Plantão', 'Extra'] },
  
  // Receitas Ozi
  { id: 'cat_salary_ozi', name: 'Salário (Ozi)', type: 'income', icon: 'briefcase', color: '#3b82f6', essential: false, member: 'Ozi', subcategories: ['Salário Mensal', '13º Salário', 'Férias', 'Bônus'] },
  { id: 'cat_diaria_ozi', name: 'Diárias de Trabalho (Ozi)', type: 'income', icon: 'calendar-check', color: '#06b6d4', essential: false, member: 'Ozi', subcategories: ['Diária', 'Plantão', 'Extra'] },
  
  // Outras Receitas
  { id: 'cat_freelance', name: 'Freelance & Serviços Extras', type: 'income', icon: 'laptop', color: '#10b981', essential: false, member: 'Ambos', subcategories: ['Freelance', 'Consultoria', 'Venda de Item'] },
  { id: 'cat_invest', name: 'Rendimentos & Investimentos', type: 'income', icon: 'trending-up', color: '#8b5cf6', essential: false, member: 'Ambos', subcategories: ['Dividendos', 'JCP', 'Rendimento CDB', 'Lucro FII'] },
  
  // 15 Despesas Solicitadas
  { id: 'cat_transport', name: 'Transporte', type: 'expense', icon: 'car', color: '#3b82f6', essential: true, member: 'Ambos', subcategories: ['Combustível', 'Parcela Carro', 'Estacionamento', 'Manutenção Preventiva', 'Manutenção Corretiva', 'Lavagem', 'Uber', 'Multa', 'Seguro', 'IPVA', 'Licenciamento'] },
  { id: 'cat_clothing_image', name: 'Vestuário e Imagem', type: 'expense', icon: 'sparkles', color: '#ec4899', essential: false, member: 'Ambos', subcategories: ['Roupas', 'Calçados', 'Acessórios', 'Salão', 'Estética', 'Cosméticos'] },
  { id: 'cat_food', name: 'Mercado e Alimentação', type: 'expense', icon: 'shopping-cart', color: '#f59e0b', essential: true, member: 'Ambos', subcategories: ['Mercado', 'Supermercado', 'Feira', 'Açougue', 'Padaria', 'Delivery', 'Restaurante'] },
  { id: 'cat_housing', name: 'Moradia', type: 'expense', icon: 'home', color: '#ef4444', essential: true, member: 'Ambos', subcategories: ['Aluguel', 'Condomínio', 'IPTU', 'Água', 'Gás', 'Luz', 'Internet residencial', 'Manutenção da casa', 'Reparos Emergenciais', 'Móveis e eletrodomésticos'] },
  { id: 'cat_leisure', name: 'Lazer', type: 'expense', icon: 'coffee', color: '#8b5cf6', essential: false, member: 'Ambos', subcategories: ['Celebrações', 'Presentes', 'Bares', 'Cinema', 'Show', 'Passeios', 'Viagem', 'Cafeteria'] },
  { id: 'cat_health', name: 'Saúde', type: 'expense', icon: 'activity', color: '#10b981', essential: true, member: 'Ambos', subcategories: ['Plano de Saúde', 'Consultas Médicas', 'Terapia', 'Medicamentos', 'Exames', 'Odontologista', 'Academia', 'Massagens'] },
  { id: 'cat_education', name: 'Educação', type: 'expense', icon: 'book-open', color: '#6366f1', essential: false, member: 'Ambos', subcategories: ['Nova Acrópole', 'Cursos', 'Livros', 'Palestras', 'Mentorias', 'Assinatura Educacional'] },
  { id: 'cat_pet', name: 'Pet', type: 'expense', icon: 'heart', color: '#d97706', essential: false, member: 'Ambos', subcategories: ['Ração', 'Veterinário', 'Vacinas', 'Medicamentos', 'Banho e Tosa', 'Brinquedos', 'Creche e Hotel', 'Acessórios'] },
  { id: 'cat_streaming', name: 'Streaming', type: 'expense', icon: 'tv', color: '#e11d48', essential: false, member: 'Ambos', subcategories: ['Netflix', 'Spotify', 'Amazon Prime'] },
  { id: 'cat_telephony', name: 'Telefonia', type: 'expense', icon: 'smartphone', color: '#06b6d4', essential: true, member: 'Ambos', subcategories: ['Cel Ju', 'Cel Ozi'] },
  { id: 'cat_taxes', name: 'Impostos', type: 'expense', icon: 'landmark', color: '#dc2626', essential: true, member: 'Ambos', subcategories: ['Imposto de Renda'] },
  { id: 'cat_fees', name: 'Taxas', type: 'expense', icon: 'percent', color: '#64748b', essential: false, member: 'Ambos', subcategories: ['Tarifa Bancária', 'Anuidade Cartão', 'Juros', 'Manutenção Conta'] },
  { id: 'cat_invest_expense', name: 'Investimentos', type: 'expense', icon: 'trending-up', color: '#059669', essential: false, member: 'Ambos', subcategories: ['Ações', 'FIIs', 'Renda Fixa', 'Meta Ju e Ozi'] },
  { id: 'cat_gardening', name: 'Jardinagem', type: 'expense', icon: 'sprout', color: '#84cc16', essential: false, member: 'Ambos', subcategories: ['Mudas', 'Terra', 'Equipamentos', 'Sementes', 'Flores'] },
  { id: 'cat_other', name: 'Outros', type: 'expense', icon: 'more-horizontal', color: '#9ca3af', essential: false, member: 'Ambos', subcategories: ['Doação', 'Extras', 'Diversos', 'Imprevistos'] }
];

export default async function handler(req, res) {
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
    // 1. Criar Tabelas
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        initial_balance NUMERIC(14,2) DEFAULT 0,
        color VARCHAR(20)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL,
        icon VARCHAR(50),
        color VARCHAR(20),
        essential BOOLEAN DEFAULT false,
        member VARCHAR(50),
        subcategories JSONB
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC(14,2) NOT NULL,
        category_id VARCHAR(64),
        subcategory VARCHAR(100),
        account_id VARCHAR(64),
        dest_account_id VARCHAR(64),
        date VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        person VARCHAR(20) NOT NULL,
        installment_group_id VARCHAR(64),
        installment_index INT,
        installment_total INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS budgets (
        id VARCHAR(64) PRIMARY KEY,
        category_id VARCHAR(64) NOT NULL,
        limit_amount NUMERIC(14,2) NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        target NUMERIC(14,2) NOT NULL,
        current NUMERIC(14,2) DEFAULT 0,
        deadline VARCHAR(20),
        icon VARCHAR(50)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS recurring (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        amount NUMERIC(14,2) NOT NULL,
        type VARCHAR(20) NOT NULL,
        due_day INT NOT NULL,
        category_id VARCHAR(64),
        account_id VARCHAR(64),
        person VARCHAR(20)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS investments (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        institution VARCHAR(100),
        amount NUMERIC(14,2) NOT NULL,
        date VARCHAR(20),
        return_rate VARCHAR(50)
      );
    `;

    // 2. Popular Contas se tabela vazia
    const existingAccounts = await sql`SELECT COUNT(*) as count FROM accounts;`;
    if (parseInt(existingAccounts.rows[0].count, 10) === 0) {
      for (const acc of DEFAULT_ACCOUNTS) {
        await sql`
          INSERT INTO accounts (id, name, type, initial_balance, color)
          VALUES (${acc.id}, ${acc.name}, ${acc.type}, ${acc.initial_balance}, ${acc.color})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    // 3. Popular/Atualizar Categorias
    const existingCats = await sql`SELECT COUNT(*) as count FROM categories;`;
    if (parseInt(existingCats.rows[0].count, 10) === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await sql`
          INSERT INTO categories (id, name, type, icon, color, essential, member, subcategories)
          VALUES (
            ${cat.id}, 
            ${cat.name}, 
            ${cat.type}, 
            ${cat.icon}, 
            ${cat.color}, 
            ${cat.essential}, 
            ${cat.member}, 
            ${JSON.stringify(cat.subcategories)}::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name,
            subcategories = EXCLUDED.subcategories,
            color = EXCLUDED.color,
            icon = EXCLUDED.icon;
        `;
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Banco de dados Vercel Postgres inicializado com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao inicializar Vercel Postgres:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro ao inicializar o banco de dados.' 
    });
  }
}
