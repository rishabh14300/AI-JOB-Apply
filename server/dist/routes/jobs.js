"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { title, company, description } = req.body;
        if (!title || !company || !description) {
            res.status(400).json({ error: 'Title, company, and description are required' });
            return;
        }
        const result = await db_1.pool.query('INSERT INTO jobs (user_id, title, company, description) VALUES ($1, $2, $3, $4) RETURNING *', [req.userId, title, company, description]);
        res.status(201).json({ job: result.rows[0] });
    }
    catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
        res.json({ jobs: result.rows });
    }
    catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM jobs WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        res.json({ job: result.rows[0] });
    }
    catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { title, company, description, status } = req.body;
        const result = await db_1.pool.query(`UPDATE jobs SET 
        title = COALESCE($1, title), 
        company = COALESCE($2, company), 
        description = COALESCE($3, description), 
        status = COALESCE($4, status) 
      WHERE id = $5 AND user_id = $6 RETURNING *`, [title, company, description, status, req.params.id, req.userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        res.json({ job: result.rows[0] });
    }
    catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await db_1.pool.query('DELETE FROM jobs WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        res.json({ message: 'Job deleted' });
    }
    catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map