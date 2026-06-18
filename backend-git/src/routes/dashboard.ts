import { Router, Request, Response } from 'express';
import { Employee, Attendance, Payroll, sequelize } from '../models';
import { requireAuth, isAdmin } from '../middleware/auth';
import { Op } from 'sequelize';

const router = Router();

router.use(requireAuth, isAdmin);

// @route   GET /api/dashboard/stats
// @desc    Get aggregated stats for Admin Dashboard (Admin only)
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Total active employees count
    const totalEmployees = await Employee.count({ where: { status: 'active' } });

    // 2. Department-wise distribution
    const deptDistribution = await Employee.findAll({
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('salary')), 'averageSalary'],
      ],
      where: { status: 'active' },
      group: ['department'],
      raw: true,
    });

    // 3. Attendance statistics for today
    const todayAttendance = await Attendance.findAll({
      where: { date: todayStr },
      raw: true,
    });

    let presentToday = 0;
    let absentToday = 0;
    let halfDayToday = 0;
    let leaveToday = 0;

    todayAttendance.forEach((att) => {
      if (att.status === 'present') presentToday++;
      else if (att.status === 'absent') absentToday++;
      else if (att.status === 'half_day') halfDayToday++;
      else if (att.status === 'leave') leaveToday++;
    });

    const markedAttendanceCount = todayAttendance.length;
    const attendanceRate = totalEmployees > 0 
      ? Math.round(((presentToday + halfDayToday * 0.5 + leaveToday) / totalEmployees) * 100)
      : 100;

    // 4. Payroll statistics (Total monthly expenditure for the last processed month)
    // Find the latest month in Payroll database
    const latestPayrollRecord = await Payroll.findOne({
      order: [['month', 'DESC']],
      attributes: ['month'],
      raw: true,
    });

    let latestMonth = latestPayrollRecord ? latestPayrollRecord.month : null;
    let monthlyPayrollExpense = 0;

    if (latestMonth) {
      const sum = await Payroll.sum('netSalary', { where: { month: latestMonth } });
      monthlyPayrollExpense = sum || 0;
    }

    // 5. Historical payroll trend (last 6 months)
    const payrollTrends = await Payroll.findAll({
      attributes: [
        'month',
        [sequelize.fn('SUM', sequelize.col('netSalary')), 'totalPayout'],
        [sequelize.fn('SUM', sequelize.col('baseSalary')), 'totalBase'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'employeeCount'],
      ],
      group: ['month'],
      order: [['month', 'ASC']],
      limit: 6,
      raw: true,
    });

    return res.json({
      totalEmployees,
      departmentDistribution: deptDistribution.map((d: any) => ({
        department: d.department,
        count: parseInt(d.count, 10),
        averageSalary: Math.round(d.averageSalary * 100) / 100,
      })),
      attendanceToday: {
        totalEmployees,
        marked: markedAttendanceCount,
        present: presentToday,
        absent: absentToday,
        halfDay: halfDayToday,
        leave: leaveToday,
        rate: attendanceRate,
      },
      payrollStats: {
        latestMonth,
        expense: monthlyPayrollExpense,
      },
      payrollTrends: payrollTrends.map((t: any) => ({
        month: t.month,
        totalPayout: Math.round(parseFloat(t.totalPayout) * 100) / 100,
        totalBase: Math.round(parseFloat(t.totalBase) * 100) / 100,
        employeeCount: parseInt(t.employeeCount, 10),
      })),
    });
  } catch (error: any) {
    console.error('Fetch dashboard stats error:', error);
    return res.status(500).json({ error: 'Server error loading analytics.' });
  }
});

export default router;
