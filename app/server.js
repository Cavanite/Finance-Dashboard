const express = require('express');
const crypto  = require('crypto');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());
app.use(express.static('/app/public'));

function authToken() {
    return crypto
        .createHmac('sha256', process.env.AUTH_PASSWORD || 'secret')
        .update(process.env.AUTH_USER || 'admin')
        .digest('hex');
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.AUTH_USER && password === process.env.AUTH_PASSWORD) {
        return res.json({ token: authToken() });
    }
    res.status(401).json({ error: 'Invalid username or password' });
});

app.use('/api', (req, res, next) => {
    if (req.path === '/login') return next();
    const header = req.headers.authorization;
    if (header === `Bearer ${authToken()}`) return next();
    res.status(401).json({ error: 'Unauthorized' });
});

(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            amount NUMERIC(10,2) NOT NULL,
            category VARCHAR(50),
            description TEXT,
            date DATE DEFAULT CURRENT_DATE,
            type VARCHAR(10) CHECK (type IN ('income','expense','savings')) NOT NULL
        );
    `);
        await pool.query(`
           CREATE TABLE IF NOT EXISTS recurring_expenses (
           id SERIAL PRIMARY KEY,
           amount NUMERIC(10,2) NOT NULL,
           category VARCHAR(50),
           description TEXT,
           frequency VARCHAR(20) CHECK (frequency IN ('daily','weekly','monthly','yearly')) NOT NULL,
           start_date DATE DEFAULT CURRENT_DATE,
           end_date DATE,
           last_generated DATE,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
        console.log('DB ready');
    } catch (err) {
    console.error('DB init error:', err.message);
    }
})();

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/db-health', async (req, res) => {
    try {
    await pool.query('SELECT 1');
        res.json({ status: 'db connected' });
    } catch (err) {
        res.json({ status: 'db error', error: err.message });
    }
});

app.get('/api/summary', async (req, res) => {
    try {
        const totalIncomeResult = await pool.query('SELECT SUM(amount) AS total_income FROM transactions WHERE type = $1', ['income']);
        const totalExpensesResult = await pool.query('SELECT SUM(amount) AS total_expenses FROM transactions WHERE type = $1', ['expense']);
        const totalSavingsResult = await pool.query('SELECT SUM(amount) AS total_savings FROM transactions WHERE type = $1', ['savings']);
        res.json({
            totalIncome: totalIncomeResult.rows[0].total_income,
            totalExpenses: totalExpensesResult.rows[0].total_expenses,
            totalSavings: totalSavingsResult.rows[0].total_savings
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/transactions', async (req, res) => {
        try {
        const result = await pool.query('SELECT * FROM transactions');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/transactions/category/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE category = $1', [category]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/transactions/type/:type', async (req, res) => {
    const { type } = req.params;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1', [type]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/transactions/date/:date', async (req, res) => {
    const { date } = req.params;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE date = $1', [date]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get ('/api/savings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1', ['savings']);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/savings', async (req, res) => {
    const { amount, category, description, date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions (amount, category, description, date, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [amount, category, description, date, 'savings']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/expenses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1', ['expense']);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/expenses/total', async (req, res) => {
    try {
        const result = await pool.query('SELECT SUM(amount) AS total_expenses FROM transactions WHERE type = $1', ['expense']);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/expenses/category/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1 AND category = $2', ['expense', category]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/income', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1', ['income']);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/income/total', async (req, res) => {
    try {
        const result = await pool.query('SELECT SUM(amount) AS total_income FROM transactions WHERE type = $1', ['income']);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/income/category/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1 AND category = $2', ['income', category]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transactions', async (req, res) => {
    const { amount, category, description, date, type } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions (amount, category, description, date, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [amount, category, description, date, type]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted', transaction: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Recurring Expenses Endpoints

app.get('/api/recurring-expenses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM recurring_expenses ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/recurring-expenses', async (req, res) => {
    const { amount, category, description, frequency, start_date, end_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO recurring_expenses (amount, category, description, frequency, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [amount, category, description, frequency, start_date, end_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/recurring-expenses/:id', async (req, res) => {
    const { id } = req.params;
    const { amount, category, description, frequency, start_date, end_date } = req.body;
    try {
        const result = await pool.query(
            'UPDATE recurring_expenses SET amount = $1, category = $2, description = $3, frequency = $4, start_date = $5, end_date = $6 WHERE id = $7 RETURNING *',
            [amount, category, description, frequency, start_date, end_date, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recurring expense not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/recurring-expenses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM recurring_expenses WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recurring expense not found' });
        }
        res.json({ message: 'Recurring expense deleted', recurring_expense: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate transactions from recurring expenses
app.post('/api/recurring-expenses/:id/generate', async (req, res) => {
    const { id } = req.params;
    try {
        const recurringResult = await pool.query('SELECT * FROM recurring_expenses WHERE id = $1', [id]);
        if (recurringResult.rows.length === 0) {
            return res.status(404).json({ error: 'Recurring expense not found' });
        }
        
        const recurring = recurringResult.rows[0];
        const today = new Date().toISOString().split('T')[0];
        
        if (recurring.end_date && recurring.end_date < today) {
            return res.status(400).json({ error: 'Recurring expense has ended' });
        }
        
        const txResult = await pool.query(
            'INSERT INTO transactions (amount, category, description, date, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [recurring.amount, recurring.category, recurring.description, today, 'expense']
        );
        
        await pool.query('UPDATE recurring_expenses SET last_generated = $1 WHERE id = $2', [today, id]);
        
        res.status(201).json(txResult.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));