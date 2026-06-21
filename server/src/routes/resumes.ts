import { Router, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

router.post('/upload', authMiddleware, upload.single('resume'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    let textContent = '';
    const buffer = req.file.buffer;
    const mimetype = req.file.mimetype;

    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      textContent = data.text;
    } else {
      const result = await mammoth.extractRawText({ buffer });
      textContent = result.value;
    }

    if (!textContent.trim()) {
      res.status(400).json({ error: 'Could not extract text from file' });
      return;
    }

    const dbResult = await pool.query(
      'INSERT INTO resumes (user_id, filename, text_content) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, req.file.originalname, textContent]
    );

    res.status(201).json({ resume: dbResult.rows[0] });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to process resume' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, filename, created_at, LENGTH(text_content) as content_length FROM resumes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ resumes: result.rows });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }
    res.json({ resume: result.rows[0] });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM resumes WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Resume deleted' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
