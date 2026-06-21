import { Router, Response } from 'express';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resumeCount = await pool.query('SELECT COUNT(*) FROM resumes WHERE user_id = $1', [req.userId]);
    const jobCount = await pool.query('SELECT COUNT(*) FROM jobs WHERE user_id = $1', [req.userId]);
    const coverLetterCount = await pool.query('SELECT COUNT(*) FROM cover_letters WHERE user_id = $1', [req.userId]);

    const recentJobs = await pool.query(
      'SELECT id, title, company, status, created_at FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [req.userId]
    );

    const recentResumes = await pool.query(
      'SELECT id, filename, created_at FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [req.userId]
    );

    const recentCoverLetters = await pool.query(
      `SELECT cl.id, cl.created_at, j.title as job_title, j.company 
       FROM cover_letters cl 
       JOIN jobs j ON cl.job_id = j.id 
       WHERE cl.user_id = $1 
       ORDER BY cl.created_at DESC LIMIT 5`,
      [req.userId]
    );

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
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
