"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, auth_1.isAdmin);
// @route   GET /api/dashboard/stats
// @desc    Get aggregated stats for Admin Dashboard (Admin only)
router.get('/stats', async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        // 1. Total active employees count
        const totalEmployees = await models_1.Employee.count({ where: { status: 'active' } });
        // 2. Department-wise distribution
        const deptDistribution = await models_1.Employee.findAll({
            attributes: [
                'department',
                [models_1.sequelize.fn('COUNT', models_1.sequelize.col('id')), 'count'],
                [models_1.sequelize.fn('AVG', models_1.sequelize.col('salary')), 'averageSalary'],
            ],
            where: { status: 'active' },
            group: ['department'],
            raw: true,
        });
        // 3. Attendance statistics for today
        const todayAttendance = await models_1.Attendance.findAll({
            where: { date: todayStr },
            raw: true,
        });
        let presentToday = 0;
        let absentToday = 0;
        let halfDayToday = 0;
        let leaveToday = 0;
        todayAttendance.forEach((att) => {
            if (att.status === 'present')
                presentToday++;
            else if (att.status === 'absent')
                absentToday++;
            else if (att.status === 'half_day')
                halfDayToday++;
            else if (att.status === 'leave')
                leaveToday++;
        });
        const markedAttendanceCount = todayAttendance.length;
        const attendanceRate = totalEmployees > 0
            ? Math.round(((presentToday + halfDayToday * 0.5 + leaveToday) / totalEmployees) * 100)
            : 100;
        // 4. Payroll statistics (Total monthly expenditure for the last processed month)
        // Find the latest month in Payroll database
        const latestPayrollRecord = await models_1.Payroll.findOne({
            order: [['month', 'DESC']],
            attributes: ['month'],
            raw: true,
        });
        let latestMonth = latestPayrollRecord ? latestPayrollRecord.month : null;
        let monthlyPayrollExpense = 0;
        if (latestMonth) {
            const sum = await models_1.Payroll.sum('netSalary', { where: { month: latestMonth } });
            monthlyPayrollExpense = sum || 0;
        }
        // 5. Historical payroll trend (last 6 months)
        const payrollTrends = await models_1.Payroll.findAll({
            attributes: [
                'month',
                [models_1.sequelize.fn('SUM', models_1.sequelize.col('netSalary')), 'totalPayout'],
                [models_1.sequelize.fn('SUM', models_1.sequelize.col('baseSalary')), 'totalBase'],
                [models_1.sequelize.fn('COUNT', models_1.sequelize.col('id')), 'employeeCount'],
            ],
            group: ['month'],
            order: [['month', 'ASC']],
            limit: 6,
            raw: true,
        });
        return res.json({
            totalEmployees,
            departmentDistribution: deptDistribution.map((d) => ({
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
            payrollTrends: payrollTrends.map((t) => ({
                month: t.month,
                totalPayout: Math.round(parseFloat(t.totalPayout) * 100) / 100,
                totalBase: Math.round(parseFloat(t.totalBase) * 100) / 100,
                employeeCount: parseInt(t.employeeCount, 10),
            })),
        });
    }
    catch (error) {
        console.error('Fetch dashboard stats error:', error);
        return res.status(500).json({ error: 'Server error loading analytics.' });
    }
});
exports.default = router;
