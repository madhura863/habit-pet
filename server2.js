const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

// Serve all static files from the same directory as server.js
app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@madhura2210',
    database: 'habit_tracker'
});

db.connect(err => {
    if (err) {
        console.error('❌ Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('✅ Connected to MySQL as id ' + db.threadId);
});

// Endpoint to get all habits for display on the habits page
app.get('/api/habits', (req, res) => {
    const userId = 1; // Assuming a single user with ID 1
    const { type } = req.query; // Get the habit type from the URL query

    let sql = `
        SELECT
            h.habit_id,
            h.habit_name,
            h.category,
            h.is_active,
            CASE WHEN hl.log_date IS NOT NULL THEN TRUE ELSE FALSE END AS is_completed_today
        FROM habits h
        LEFT JOIN habit_logs hl ON h.habit_id = hl.habit_id AND hl.log_date = CURDATE()
        WHERE h.user_id = ? AND h.is_active = TRUE
    `;

    const queryParams = [userId];

    if (type) {
        sql += ` AND h.habit_type = ?`;
        queryParams.push(type);
    }
    
    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error('❌ Query failed:', err);
            return res.status(500).send('Database query failed.');
        }
        res.json(results);
    });
});

// Endpoint to handle habit completion
app.post('/api/complete-habit', (req, res) => {
    const { habitId } = req.body;
    const userId = 1; 
    
    const sqlLog = `INSERT INTO habit_logs (habit_id, log_date) VALUES (?, CURDATE())`;
    
    db.query(sqlLog, [habitId], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).send('Habit already completed for today.');
            }
            console.error('❌ Insert failed:', err);
            return res.status(500).send('Failed to log habit completion.');
        }

        const sqlUpdateXp = `UPDATE users SET total_xp = total_xp + 50 WHERE user_id = ?`;
        db.query(sqlUpdateXp, [userId], (err, result) => {
            if (err) {
                console.error('❌ XP update failed:', err);
            }
        });

        res.status(200).send('Habit completed successfully!');
    });
});

// Endpoint to get daily progress for the dashboard
app.get('/api/progress', (req, res) => {
    const userId = 1; // Assuming a single user with ID 1 for now
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM habits WHERE user_id = ? AND is_active = TRUE) AS total_daily_habits,
            COUNT(hl.habit_id) AS completed_today
        FROM habit_logs hl
        WHERE hl.log_date = CURDATE()
        AND hl.habit_id IN (SELECT habit_id FROM habits WHERE user_id = ? AND is_active = TRUE);
    `;

    db.query(sql, [userId, userId], (err, results) => {
        if (err) {
            console.error('❌ Progress query failed:', err);
            return res.status(500).send('Database query failed.');
        }
        // Send the first row of results, which contains the numbers
        res.json(results[0]);
    });
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});