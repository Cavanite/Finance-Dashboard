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

function hashPassword(password) {
    return crypto
        .createHmac('sha256', process.env.AUTH_PASSWORD || 'secret')
        .update(password)
        .digest('hex');
}

function isAdmin(username) {
    return username === (process.env.AUTH_USER || 'admin');
}

// Recurring Expense Generator Function
async function processRecurringExpenses() {
    try {
        const result = await pool.query('SELECT * FROM recurring_expenses WHERE is_active = true');
        const recurringExpenses = result.rows;
        const today = new Date().toISOString().split('T')[0];
        const todayDate = new Date(today);
        const todayDay = todayDate.getDate();
        const todayDayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayDate.getDay()];

        for (const recurring of recurringExpenses) {
            // Check if expense has ended
            if (recurring.end_date && recurring.end_date < today) {
                continue;
            }

            // Check if start date hasn't arrived yet
            if (recurring.start_date > today) {
                continue;
            }

            let shouldGenerate = false;
            const lastGenerated = recurring.last_generated ? new Date(recurring.last_generated) : null;

            if (!lastGenerated) {
                // Never generated before, create one for start date if today >= start_date
                shouldGenerate = true;
            } else {
                const daysDiff = Math.floor((todayDate - lastGenerated) / (1000 * 60 * 60 * 24));

                switch (recurring.frequency) {
                    case 'daily':
                        shouldGenerate = daysDiff >= 1;
                        break;
                    case 'weekly':
                        // If day_of_week is set, only generate on that day
                        if (recurring.day_of_week) {
                            shouldGenerate = todayDayOfWeek === recurring.day_of_week && daysDiff >= 1;
                        } else {
                            shouldGenerate = daysDiff >= 7;
                        }
                        break;
                    case 'monthly':
                        // If day_of_month is set, only generate on that day
                        if (recurring.day_of_month) {
                            shouldGenerate = todayDay === recurring.day_of_month && daysDiff >= 1;
                        } else {
                            shouldGenerate = todayDate.getMonth() !== lastGenerated.getMonth() || 
                                           todayDate.getFullYear() !== lastGenerated.getFullYear();
                        }
                        break;
                    case 'yearly':
                        shouldGenerate = todayDate.getFullYear() !== lastGenerated.getFullYear();
                        break;
                }
            }

            if (shouldGenerate) {
                // Create transaction
                await pool.query(
                    'INSERT INTO transactions (amount, category, description, date, type, owner_username) VALUES ($1, $2, $3, $4, $5, $6)',
                    [recurring.amount, recurring.category, recurring.description, today, 'expense', recurring.owner_username]
                );

                // Update last_generated timestamp
                await pool.query(
                    'UPDATE recurring_expenses SET last_generated = $1 WHERE id = $2',
                    [today, recurring.id]
                );

                console.log(`Generated recurring expense: ${recurring.description} (${recurring.category})`);
            }
        }
    } catch (err) {
        console.error('Error processing recurring expenses:', err.message);
    }
}

// Run recurring expense processor every hour
setInterval(processRecurringExpenses, 60 * 60 * 1000);

// Also run on startup
processRecurringExpenses();

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Check if it's the admin user
        if (username === process.env.AUTH_USER && password === process.env.AUTH_PASSWORD) {
            return res.json({ token: authToken(), username, isAdmin: true });
        }
        
        // Check other users in database
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND is_active = true',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const user = result.rows[0];
        const expectedHash = hashPassword(password);
        
        if (user.password_hash !== expectedHash) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Generate token for user
        const token = crypto
            .createHmac('sha256', process.env.AUTH_PASSWORD || 'secret')
            .update(username)
            .digest('hex');
        
        res.json({ token, username, isAdmin: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use('/api', async (req, res, next) => {
    if (req.path === '/login') return next();
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (token === authToken()) {
        req.authUser = process.env.AUTH_USER || 'admin';
        req.isAdmin = true;
        return next();
    }
    try {
        const usersResult = await pool.query('SELECT username FROM users WHERE is_active = true');
        const secret = process.env.AUTH_PASSWORD || 'secret';
        const matchedUser = usersResult.rows.find(({ username }) => {
            const expectedToken = crypto.createHmac('sha256', secret).update(username).digest('hex');
            return expectedToken === token;
        });
        if (matchedUser) {
            req.authUser = matchedUser.username;
            req.isAdmin = false;
            return next();
        }
        return res.status(401).json({ error: 'Unauthorized' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

(async () => {
    try {
        const adminUser = process.env.AUTH_USER || 'admin';
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            amount NUMERIC(10,2) NOT NULL,
            category VARCHAR(50),
            description TEXT,
            date DATE DEFAULT CURRENT_DATE,
            type VARCHAR(10) CHECK (type IN ('income','expense','savings')) NOT NULL,
            owner_username VARCHAR(50)
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
           is_active BOOLEAN DEFAULT true,
           day_of_month INTEGER,
           day_of_week VARCHAR(10),
           owner_username VARCHAR(50),
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
        
        // Add columns if they don't exist (for existing installations)
        await pool.query(`
            ALTER TABLE recurring_expenses
            ADD COLUMN IF NOT EXISTS day_of_month INTEGER,
            ADD COLUMN IF NOT EXISTS day_of_week VARCHAR(10),
            ADD COLUMN IF NOT EXISTS owner_username VARCHAR(50)
        `);
        await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS owner_username VARCHAR(50)`);
        await pool.query('UPDATE transactions SET owner_username = $1 WHERE owner_username IS NULL', [adminUser]);
        await pool.query('UPDATE recurring_expenses SET owner_username = $1 WHERE owner_username IS NULL', [adminUser]);
        await pool.query(`
           CREATE TABLE IF NOT EXISTS users (
           id SERIAL PRIMARY KEY,
           username VARCHAR(50) UNIQUE NOT NULL,
           password_hash VARCHAR(255) NOT NULL,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           created_by VARCHAR(50),
           is_active BOOLEAN DEFAULT true
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
        const owner = req.authUser;
        const totalIncomeResult = await pool.query('SELECT SUM(amount) AS total_income FROM transactions WHERE type = $1 AND owner_username = $2', ['income', owner]);
        const totalExpensesResult = await pool.query('SELECT SUM(amount) AS total_expenses FROM transactions WHERE type = $1 AND owner_username = $2', ['expense', owner]);
        const totalSavingsResult = await pool.query('SELECT SUM(amount) AS total_savings FROM transactions WHERE type = $1 AND owner_username = $2', ['savings', owner]);
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
        const result = await pool.query('SELECT * FROM transactions WHERE owner_username = $1', [req.authUser]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/transactions/category/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE category = $1 AND owner_username = $2', [category, req.authUser]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/transactions/type/:type', async (req, res) => {
    const { type } = req.params;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1 AND owner_username = $2', [type, req.authUser]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/transactions/date/:date', async (req, res) => {
    const { date } = req.params;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE date = $1 AND owner_username = $2', [date, req.authUser]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get ('/api/savings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1 AND owner_username = $2', ['savings', req.authUser]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/savings', async (req, res) => {
    const { amount, category, description, date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions (amount, category, description, date, type, owner_username) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [amount, category, description, date, 'savings', req.authUser]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/expenses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1 AND owner_username = $2', ['expense', req.authUser]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/expenses/total', async (req, res) => {
    try {
        const result = await pool.query('SELECT SUM(amount) AS total_expenses FROM transactions WHERE type = $1 AND owner_username = $2', ['expense', req.authUser]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/expenses/category/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1 AND category = $2 AND owner_username = $3', ['expense', category, req.authUser]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/income', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1 AND owner_username = $2', ['income', req.authUser]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/income/total', async (req, res) => {
    try {
        const result = await pool.query('SELECT SUM(amount) AS total_income FROM transactions WHERE type = $1 AND owner_username = $2', ['income', req.authUser]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/income/category/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE type = $1 AND category = $2 AND owner_username = $3', ['income', category, req.authUser]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transactions', async (req, res) => {
    const { amount, category, description, date, type } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions (amount, category, description, date, type, owner_username) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [amount, category, description, date, type, req.authUser]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    const { amount, category, description, date, type } = req.body;
    try {
        const result = await pool.query(
            'UPDATE transactions SET amount = $1, category = $2, description = $3, date = $4, type = $5 WHERE id = $6 AND owner_username = $7 RETURNING *',
            [amount, category, description, date, type, id, req.authUser]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM transactions WHERE id = $1 AND owner_username = $2 RETURNING *', [id, req.authUser]);
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
        const result = await pool.query('SELECT * FROM recurring_expenses WHERE owner_username = $1 ORDER BY created_at DESC', [req.authUser]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/recurring-expenses', async (req, res) => {
    const { amount, category, description, frequency, start_date, end_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO recurring_expenses (amount, category, description, frequency, start_date, end_date, owner_username) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [amount, category, description, frequency, start_date, end_date, req.authUser]
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
            'UPDATE recurring_expenses SET amount = $1, category = $2, description = $3, frequency = $4, start_date = $5, end_date = $6 WHERE id = $7 AND owner_username = $8 RETURNING *',
            [amount, category, description, frequency, start_date, end_date, id, req.authUser]
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
        const result = await pool.query('DELETE FROM recurring_expenses WHERE id = $1 AND owner_username = $2 RETURNING *', [id, req.authUser]);
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
        const recurringResult = await pool.query('SELECT * FROM recurring_expenses WHERE id = $1 AND owner_username = $2', [id, req.authUser]);
        if (recurringResult.rows.length === 0) {
            return res.status(404).json({ error: 'Recurring expense not found' });
        }
        
        const recurring = recurringResult.rows[0];
        const today = new Date().toISOString().split('T')[0];
        
        if (recurring.end_date && recurring.end_date < today) {
            return res.status(400).json({ error: 'Recurring expense has ended' });
        }
        
        const txResult = await pool.query(
            'INSERT INTO transactions (amount, category, description, date, type, owner_username) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [recurring.amount, recurring.category, recurring.description, today, 'expense', req.authUser]
        );
        
        await pool.query('UPDATE recurring_expenses SET last_generated = $1 WHERE id = $2', [today, id]);
        
        res.status(201).json(txResult.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Payday Calculation Endpoint
app.get('/api/payday', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM transactions WHERE type = $1 AND owner_username = $2 ORDER BY date DESC LIMIT 12',
            ['income', req.authUser]
        );

        const incomes = result.rows;
        if (incomes.length === 0) {
            return res.json({ nextPayday: null, frequency: null, daysUntil: null });
        }

        // Calculate average days between income transactions
        let daysBetweenIncomes = [];
        for (let i = 0; i < incomes.length - 1; i++) {
            const diff = Math.floor((new Date(incomes[i].date) - new Date(incomes[i + 1].date)) / (1000 * 60 * 60 * 24));
            if (diff > 0) {
                daysBetweenIncomes.push(diff);
            }
        }

        if (daysBetweenIncomes.length === 0) {
            return res.json({ nextPayday: null, frequency: null, daysUntil: null });
        }

        // Calculate average cycle
        const avgCycle = Math.round(daysBetweenIncomes.reduce((a, b) => a + b, 0) / daysBetweenIncomes.length);

        // Determine frequency
        let frequency = 'unknown';
        if (avgCycle >= 27 && avgCycle <= 31) frequency = 'monthly';
        else if (avgCycle >= 13 && avgCycle <= 15) frequency = 'bi-weekly';
        else if (avgCycle >= 6 && avgCycle <= 8) frequency = 'weekly';
        else if (avgCycle === 1) frequency = 'daily';

        // Calculate next payday
        const lastPayday = new Date(incomes[0].date);
        const nextPayday = new Date(lastPayday);
        nextPayday.setDate(nextPayday.getDate() + avgCycle);

        // Days until next payday
        const today = new Date();
        const daysUntil = Math.ceil((nextPayday - today) / (1000 * 60 * 60 * 24));

        res.json({
            lastPayday: incomes[0].date,
            nextPayday: nextPayday.toISOString().split('T')[0],
            frequency,
            avgCycle,
            daysUntil: Math.max(0, daysUntil),
            totalIncome: incomes.reduce((sum, tx) => sum + Number(tx.amount), 0),
            recentIncomes: incomes.slice(0, 6),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Recurring Expenses Toggle
app.patch('/api/recurring-expenses/:id/toggle', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE recurring_expenses SET is_active = NOT is_active WHERE id = $1 AND owner_username = $2 RETURNING *',
            [id, req.authUser]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recurring expense not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Endpoints

app.get('/api/admin/users', async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const result = await pool.query('SELECT id, username, created_at, created_by, is_active FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/users', async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const passwordHash = hashPassword(password);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, created_by) VALUES ($1, $2, $3) RETURNING id, username, created_at, is_active',
            [username, passwordHash, req.authUser]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.message.includes('duplicate')) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { id } = req.params;
        const result = await pool.query('UPDATE users SET is_active = false WHERE id = $1 RETURNING id, username', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deactivated', user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));