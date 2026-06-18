import { Router, Request, Response } from 'express';
import { Attendance, Employee } from '../models';
import { requireAuth, isAdmin } from '../middleware/auth';
import { Op } from 'sequelize';

const router = Router();

router.use(requireAuth);

// @route   GET /api/attendance
// @desc    Get attendance records (Admin only, filters: date, month, employeeId)
router.get('/', isAdmin, async (req: Request, res: Response) => {
  try {
    const { date, month, employeeId } = req.query;
    const whereClause: any = {};

    if (date) {
      whereClause.date = date as string;
    } else if (month) {
      // month is YYYY-MM
      whereClause.date = {
        [Op.like]: `${month}%`,
      };
    }

    if (employeeId) {
      whereClause.employeeId = parseInt(employeeId as string);
    }

    const records = await Attendance.findAll({
      where: whereClause,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name', 'department', 'position'] }],
      order: [['date', 'DESC']],
    });

    return res.json(records);
  } catch (error: any) {
    console.error('Fetch attendance error:', error);
    return res.status(500).json({ error: 'Server error fetching attendance.' });
  }
});

// @route   GET /api/attendance/my
// @desc    Get current employee's attendance records
router.get('/my', async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'employee' || !req.user.employeeId) {
      return res.status(403).json({ error: 'Access denied. Employee profile required.' });
    }

    const { month } = req.query;
    const whereClause: any = { employeeId: req.user.employeeId };

    if (month) {
      whereClause.date = {
        [Op.like]: `${month}%`,
      };
    }

    const records = await Attendance.findAll({
      where: whereClause,
      order: [['date', 'DESC']],
    });

    return res.json(records);
  } catch (error: any) {
    console.error('Fetch my attendance error:', error);
    return res.status(500).json({ error: 'Server error fetching your attendance.' });
  }
});

// @route   POST /api/attendance
// @desc    Mark/update attendance for a single employee (Admin only)
router.post('/', isAdmin, async (req: Request, res: Response) => {
  try {
    const { employeeId, date, status } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({ error: 'Employee ID, date, and status are required.' });
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Upsert attendance
    const [record, created] = await Attendance.upsert({
      employeeId,
      date,
      status,
    });

    return res.json({ message: 'Attendance marked successfully', record, created });
  } catch (error: any) {
    console.error('Save attendance error:', error);
    return res.status(500).json({ error: 'Server error marking attendance.' });
  }
});

// @route   POST /api/attendance/bulk
// @desc    Mark/update bulk attendance for multiple employees (Admin only)
router.post('/bulk', isAdmin, async (req: Request, res: Response) => {
  try {
    const { records } = req.body; // Expect array of { employeeId, date, status }

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required.' });
    }

    const results = [];
    for (const record of records) {
      const { employeeId, date, status } = record;
      if (employeeId && date && status) {
        const [upsertedRecord] = await Attendance.upsert({
          employeeId,
          date,
          status,
        });
        results.push(upsertedRecord);
      }
    }

    return res.json({ message: `Successfully processed ${results.length} attendance records.`, records: results });
  } catch (error: any) {
    console.error('Bulk attendance error:', error);
    return res.status(500).json({ error: 'Server error processing bulk attendance.' });
  }
});

export default router;
