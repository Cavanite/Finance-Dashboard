const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());
app.use(express.static('/app/public'));

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

app.listen(3000, () => console.log('Server running on port 3000'));