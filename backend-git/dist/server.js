"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("./models");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const employees_1 = __importDefault(require("./routes/employees"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const payroll_1 = __importDefault(require("./routes/payroll"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins for local development, can be restricted later
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/employees', employees_1.default);
app.use('/api/attendance', attendance_1.default);
app.use('/api/payroll', payroll_1.default);
app.use('/api/dashboard', dashboard_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});
// Database Synchronization & Server Startup
async function startServer() {
    try {
        // Sync all models with SQLite DB (force: false preserves existing data)
        await models_1.sequelize.sync({ force: false });
        console.log('Database synchronized successfully.');
        app.listen(PORT, () => {
            console.log(`HRMS Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server / sync database:', error);
        process.exit(1);
    }
}
startServer();
