"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const resumeCount = await db_1.pool.query('SELECT COUNT(*) FROM resumes WHERE user_id = $1', [req.userId]);
        const jobCount = await db_1.pool.query('SELECT COUNT(*) FROM jobs WHERE user_id = $1', [req.userId]);
        const coverLetterCount = await db_1.pool.query('SELECT COUNT(*) FROM cover_letters WHERE user_id = $1', [req.userId]);
        const recentJobs = await db_1.pool.query('SELECT id, title, company, status, created_at FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [req.userId]);
        const recentResumes = await db_1.pool.query('SELECT id, filename, created_at FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [req.userId]);
        const recentCoverLetters = await db_1.pool.query(`SELECT cl.id, cl.created_at, j.title as job_title, j.company 
       FROM cover_letters cl 
       JOIN jobs j ON cl.job_id = j.id 
       WHERE cl.user_id = $1 
       ORDER BY cl.created_at DESC LIMIT 5`, [req.userId]);
        res.json({
            stats: {
                resumes: parseInt(resumeCount.rows[0].count),
                jobs: parseInt(jobCount.rows[0].count),
                coverLetters: parseInt(coverLetterCount.rows[0].count),
            },
            recentJobs: recentJobs.rows,
            recentResumes: recentResumes.rows,
            recentCoverLetters: recentCoverLetters.rows,
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map