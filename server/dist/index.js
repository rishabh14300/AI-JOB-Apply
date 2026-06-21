"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const auth_1 = __importDefault(require("./routes/auth"));
const resumes_1 = __importDefault(require("./routes/resumes"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const ai_1 = __importDefault(require("./routes/ai"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '50mb' }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/resumes', resumes_1.default);
app.use('/api/jobs', jobs_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/dashboard', dashboard_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
async function start() {
    try {
        await (0, db_1.initDB)();
    }
    catch (error) {
        console.error('⚠️ Database connection failed during startup; continuing without DB initialization:', error);
    }
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
}
start();
//# sourceMappingURL=index.js.map