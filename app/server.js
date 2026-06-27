const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());
app.use(express.static('/app/public'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(3000, () => console.log('Server running on port 3000'));

app.get('/api/db-health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'db connected' });
    } catch (err) {
        res.json({ status: 'db error', error: err.message });
    }
});