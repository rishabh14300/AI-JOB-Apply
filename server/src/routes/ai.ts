import { Router, Response } from 'express';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { optimizeResume, generateCoverLetter, generateInterviewPrep } from '../services/gemini';

const router = Router();

router.post('/optimize', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resumeId, jobId } = req.body;

    if (!resumeId || !jobId) {
      res.status(400).json({ error: 'Resume ID and Job ID are required' });
      return;
    }

    const resumeResult = await pool.query(
      'SELECT text_content FROM resumes WHERE id = $1 AND user_id = $2',
      [resumeId, req.userId]
    );
    if (resumeResult.rows.length === 0) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    const jobResult = await pool.query(
      'SELECT description FROM jobs WHERE id = $1 AND user_id = $2',
      [jobId, req.userId]
    );
    if (jobResult.rows.length === 0) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const analysis = await optimizeResume(resumeResult.rows[0].text_content, jobResult.rows[0].description);
    res.json({ analysis });
  } catch (error) {
    console.error('Optimize error:', error);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

router.post('/cover-letter', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resumeId, jobId } = req.body;

    if (!resumeId || !jobId) {
      res.status(400).json({ error: 'Resume ID and Job ID are required' });
      return;
    }

    const resumeResult = await pool.query(
      'SELECT text_content FROM resumes WHERE id = $1 AND user_id = $2',
      [resumeId, req.userId]
    );
    if (resumeResult.rows.length === 0) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }

    const jobResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [jobId, req.userId]
    );
    if (jobResult.rows.length === 0) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const job = jobResult.rows[0];
    const coverLetter = await generateCoverLetter(
      resumeResult.rows[0].text_content,
      job.description,
      job.title,
      job.company
    );

    // Save to database
    const saved = await pool.query(
      'INSERT INTO cover_letters (user_id, job_id, resume_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, jobId, resumeId, coverLetter]
    );

    res.json({ coverLetter: saved.rows[0] });
  } catch (error) {
    console.error('Cover letter error:', error);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

router.post('/interview', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }

    const jobResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [jobId, req.userId]
    );
    if (jobResult.rows.length === 0) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const job = jobResult.rows[0];
    const prep = await generateInterviewPrep(job.title, job.description);
    res.json({ prep });
  } catch (error) {
    console.error('Interview prep error:', error);
    res.status(500).json({ error: 'Failed to generate interview prep' });
  }
});

router.get('/cover-letters', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT cl.*, j.title as job_title, j.company 
       FROM cover_letters cl 
       JOIN jobs j ON cl.job_id = j.id 
       WHERE cl.user_id = $1 
       ORDER BY cl.created_at DESC`,
      [req.userId]
    );
    res.json({ coverLetters: result.rows });
  } catch (error) {
    console.error('Get cover letters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
