"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply auth to all employee routes
router.use(auth_1.requireAuth);
// @route   GET /api/employees
// @desc    Get all employees (Admin only)
router.get('/', auth_1.isAdmin, async (req, res) => {
    try {
        const employees = await models_1.Employee.findAll({
            order: [['id', 'DESC']],
        });
        return res.json(employees);
    }
    catch (error) {
        console.error('Fetch employees error:', error);
        return res.status(500).json({ error: 'Server error fetching employees.' });
    }
});
// @route   GET /api/employees/:id
// @desc    Get a single employee's profile
router.get('/:id', async (req, res) => {
    try {
        const employeeId = parseInt(req.params.id);
        // Employees can only view their own profile; admins can view any
        if (req.user?.role === 'employee' && req.user.employeeId !== employeeId) {
            return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
        }
        const employee = await models_1.Employee.findByPk(employeeId, {
            include: [{ model: models_1.User, as: 'user', attributes: ['id', 'email', 'role'] }],
        });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }
        return res.json(employee);
    }
    catch (error) {
        console.error('Fetch employee detail error:', error);
        return res.status(500).json({ error: 'Server error fetching employee profile.' });
    }
});
// @route   POST /api/employees
// @desc    Create a new employee (Admin only)
router.post('/', auth_1.isAdmin, async (req, res) => {
    try {
        const { name, email, department, position, salary, joiningDate } = req.body;
        if (!name || !email || !department || !position || salary === undefined || !joiningDate) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        // Check if email already in use by another employee
        const existingEmployee = await models_1.Employee.findOne({ where: { email } });
        if (existingEmployee) {
            return res.status(400).json({ error: 'An employee with this email already exists.' });
        }
        const newEmployee = await models_1.Employee.create({
            name,
            email,
            department,
            position,
            salary: parseFloat(salary),
            joiningDate,
            status: 'active',
        });
        return res.status(201).json(newEmployee);
    }
    catch (error) {
        console.error('Create employee error:', error);
        return res.status(500).json({ error: 'Server error creating employee record.' });
    }
});
// @route   PUT /api/employees/:id
// @desc    Update employee details (Admin only)
router.put('/:id', auth_1.isAdmin, async (req, res) => {
    try {
        const employeeId = parseInt(req.params.id);
        const { name, email, department, position, salary, joiningDate, status } = req.body;
        const employee = await models_1.Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }
        // Check email uniqueness if email changes
        if (email && email !== employee.email) {
            const existingEmployee = await models_1.Employee.findOne({ where: { email } });
            if (existingEmployee) {
                return res.status(400).json({ error: 'An employee with this email already exists.' });
            }
        }
        // Update fields
        await employee.update({
            name: name || employee.name,
            email: email || employee.email,
            department: department || employee.department,
            position: position || employee.position,
            salary: salary !== undefined ? parseFloat(salary) : employee.salary,
            joiningDate: joiningDate || employee.joiningDate,
            status: status || employee.status,
        });
        // If the employee email was updated, update the associated user login email as well
        if (email && email !== employee.email) {
            await models_1.User.update({ email }, { where: { employeeId: employee.id } });
        }
        return res.json(employee);
    }
    catch (error) {
        console.error('Update employee error:', error);
        return res.status(500).json({ error: 'Server error updating employee.' });
    }
});
// @route   DELETE /api/employees/:id
// @desc    Delete employee record and clean up logins (Admin only)
router.delete('/:id', auth_1.isAdmin, async (req, res) => {
    try {
        const employeeId = parseInt(req.params.id);
        const employee = await models_1.Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }
        // Delete associated login user account (if any)
        await models_1.User.destroy({ where: { employeeId } });
        // Delete employee record (cascades automatically to Attendance and Payroll due to associations)
        await employee.destroy();
        return res.json({ message: 'Employee and associated login account successfully deleted.' });
    }
    catch (error) {
        console.error('Delete employee error:', error);
        return res.status(500).json({ error: 'Server error deleting employee.' });
    }
});
exports.default = router;
