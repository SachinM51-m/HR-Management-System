"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// @route   GET /api/payroll
// @desc    Get payroll records for a month (Admin only)
router.get('/', auth_1.isAdmin, async (req, res) => {
    try {
        const { month } = req.query;
        const whereClause = {};
        if (month) {
            whereClause.month = month;
        }
        const records = await models_1.Payroll.findAll({
            where: whereClause,
            include: [{ model: models_1.Employee, as: 'employee', attributes: ['id', 'name', 'department', 'position', 'email'] }],
            order: [['month', 'DESC']],
        });
        return res.json(records);
    }
    catch (error) {
        console.error('Fetch payroll error:', error);
        return res.status(500).json({ error: 'Server error fetching payroll records.' });
    }
});
// @route   GET /api/payroll/my
// @desc    Get current employee's payroll history
router.get('/my', async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'employee' || !req.user.employeeId) {
            return res.status(403).json({ error: 'Access denied. Employee profile required.' });
        }
        const records = await models_1.Payroll.findAll({
            where: { employeeId: req.user.employeeId },
            include: [{ model: models_1.Employee, as: 'employee', attributes: ['id', 'name', 'department', 'position', 'email'] }],
            order: [['month', 'DESC']],
        });
        return res.json(records);
    }
    catch (error) {
        console.error('Fetch my payroll error:', error);
        return res.status(500).json({ error: 'Server error fetching your payroll.' });
    }
});
// @route   POST /api/payroll/calculate
// @desc    Calculate monthly payroll based on attendance (Admin only)
router.post('/calculate', auth_1.isAdmin, async (req, res) => {
    try {
        const { month, employeeId, bonus = 0, deductions = 0 } = req.body; // month is YYYY-MM
        if (!month) {
            return res.status(400).json({ error: 'Month (YYYY-MM) is required.' });
        }
        // Find target employees (all active, or one specified)
        const employeeQuery = { status: 'active' };
        if (employeeId) {
            employeeQuery.id = employeeId;
        }
        const employees = await models_1.Employee.findAll({ where: employeeQuery });
        if (employees.length === 0) {
            return res.status(404).json({ error: 'No active employees found.' });
        }
        const calculatedPayrolls = [];
        for (const emp of employees) {
            // Fetch attendance for this employee in this month
            const attendanceRecords = await models_1.Attendance.findAll({
                where: {
                    employeeId: emp.id,
                    date: {
                        [sequelize_1.Op.like]: `${month}%`,
                    },
                },
            });
            // Calculate days
            let presentCount = 0;
            let absentCount = 0;
            let halfDayCount = 0;
            let leaveCount = 0;
            attendanceRecords.forEach((att) => {
                if (att.status === 'present')
                    presentCount++;
                else if (att.status === 'absent')
                    absentCount++;
                else if (att.status === 'half_day')
                    halfDayCount++;
                else if (att.status === 'leave')
                    leaveCount++;
            });
            const baseSalary = emp.salary;
            const expectedWorkingDays = 22; // Standard business working days in a month
            // Attendance-based deduction calculation
            // Deduction rule: 1 full day deduction for absent, 0.5 deduction for half-day. Paid leaves are not deducted.
            // If no attendance records are marked, we assume 100% attendance (so no deduction).
            let attendanceDeductions = 0;
            if (attendanceRecords.length > 0) {
                const totalDeductedDays = absentCount + halfDayCount * 0.5;
                attendanceDeductions = Math.round(((baseSalary / expectedWorkingDays) * totalDeductedDays) * 100) / 100;
            }
            // Add manual deductions
            const totalDeductions = Math.min(baseSalary, attendanceDeductions + parseFloat(deductions));
            const totalBonus = parseFloat(bonus);
            const netSalary = Math.round((baseSalary - totalDeductions + totalBonus) * 100) / 100;
            // Upsert payroll entry for this month
            const [payrollRecord] = await models_1.Payroll.upsert({
                employeeId: emp.id,
                month,
                baseSalary,
                deductions: totalDeductions,
                bonus: totalBonus,
                netSalary,
                status: 'unpaid',
                paidAt: null,
            });
            calculatedPayrolls.push({
                employee: {
                    id: emp.id,
                    name: emp.name,
                    department: emp.department,
                    position: emp.position,
                },
                attendanceSummary: {
                    present: presentCount,
                    absent: absentCount,
                    halfDay: halfDayCount,
                    leave: leaveCount,
                    totalLogged: attendanceRecords.length,
                },
                payroll: payrollRecord,
            });
        }
        return res.json({
            message: `Calculated payroll successfully for ${calculatedPayrolls.length} employees for ${month}.`,
            results: calculatedPayrolls,
        });
    }
    catch (error) {
        console.error('Calculate payroll error:', error);
        return res.status(500).json({ error: 'Server error calculating payroll.' });
    }
});
// @route   POST /api/payroll/:id/pay
// @desc    Mark payroll as paid (Admin only)
router.post('/:id/pay', auth_1.isAdmin, async (req, res) => {
    try {
        const payrollId = parseInt(req.params.id);
        const payroll = await models_1.Payroll.findByPk(payrollId);
        if (!payroll) {
            return res.status(404).json({ error: 'Payroll record not found.' });
        }
        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        await payroll.update({
            status: 'paid',
            paidAt: todayDate,
        });
        return res.json({ message: 'Payroll status updated to paid.', payroll });
    }
    catch (error) {
        console.error('Mark pay error:', error);
        return res.status(500).json({ error: 'Server error marking payroll as paid.' });
    }
});
exports.default = router;
