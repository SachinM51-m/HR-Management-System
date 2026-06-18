"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'hrms_super_secret_key_12345';
const TOKEN_EXPIRY = '24h';
// @route   POST /api/auth/signup
// @desc    Register a new user
router.post('/signup', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email.' });
        }
        const userRole = role === 'admin' ? 'admin' : 'employee';
        let employeeId = null;
        // If signing up as employee, verify employee record exists
        if (userRole === 'employee') {
            const employee = await models_1.Employee.findOne({ where: { email } });
            if (!employee) {
                return res.status(400).json({
                    error: 'Employee record with this email does not exist. Please contact your HR Admin.',
                });
            }
            employeeId = employee.id;
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Create User
        const newUser = await models_1.User.create({
            email,
            passwordHash,
            role: userRole,
            employeeId,
        });
        // Create JWT
        const token = jsonwebtoken_1.default.sign({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            employeeId: newUser.employeeId,
        }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
        return res.status(201).json({
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                employeeId: newUser.employeeId,
            },
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Server error during signup.' });
    }
});
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        // Find User
        const user = await models_1.User.findOne({
            where: { email },
            include: [{ model: models_1.Employee, as: 'employee' }],
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }
        // Verify Password
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }
        // Create JWT
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
        }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                employeeId: user.employeeId,
                employee: user.employee,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server error during login.' });
    }
});
// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }
        const user = await models_1.User.findByPk(req.user.id, {
            attributes: { exclude: ['passwordHash'] },
            include: [{ model: models_1.Employee, as: 'employee' }],
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.json(user);
    }
    catch (error) {
        console.error('Get me error:', error);
        return res.status(500).json({ error: 'Server error.' });
    }
});
exports.default = router;
