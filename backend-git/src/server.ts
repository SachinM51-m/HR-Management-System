import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models';

// Import routes
import authRouter from './routes/auth';
import employeesRouter from './routes/employees';
import attendanceRouter from './routes/attendance';
import payrollRouter from './routes/payroll';
import dashboardRouter from './routes/dashboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local development, can be restricted later
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Database Synchronization & Server Startup
async function startServer() {
  try {
    // Sync all models with SQLite DB (force: false preserves existing data)
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`HRMS Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server / sync database:', error);
    process.exit(1);
  }
}

startServer();
