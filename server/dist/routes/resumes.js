"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF and DOCX files are allowed'));
        }
    },
});
router.post('/upload', auth_1.authMiddleware, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        let textContent = '';
        const buffer = req.file.buffer;
        const mimetype = req.file.mimetype;
        if (mimetype === 'application/pdf') {
            const data = await (0, pdf_parse_1.default)(buffer);
            textContent = data.text;
        }
        else {
            const result = await mammoth_1.default.extractRawText({ buffer });
            textContent = result.value;
        }
        if (!textContent.trim()) {
            res.status(400).json({ error: 'Could not extract text from file' });
            return;
        }
        const dbResult = await db_1.pool.query('INSERT INTO resumes (user_id, filename, text_content) VALUES ($1, $2, $3) RETURNING *', [req.userId, req.file.originalname, textContent]);
        res.status(201).json({ resume: dbResult.rows[0] });
    }
    catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ error: 'Failed to process resume' });
    }
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT id, filename, created_at, LENGTH(text_content) as content_length FROM resumes WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
        res.json({ resumes: result.rows });
    }
    catch (error) {
        console.error('Get resumes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM resumes WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Resume not found' });
            return;
        }
        res.json({ resume: result.rows[0] });
    }
    catch (error) {
        console.error('Get resume error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await db_1.pool.query('DELETE FROM resumes WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
        res.json({ message: 'Resume deleted' });
    }
    catch (error) {
        console.error('Delete resume error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=resumes.js.map