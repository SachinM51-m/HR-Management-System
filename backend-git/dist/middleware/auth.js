"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmployee = exports.isAdmin = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'hrms_super_secret_key_12345';
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
exports.requireAuth = requireAuth;
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
};
exports.isAdmin = isAdmin;
const isEmployee = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (req.user.role !== 'employee') {
        return res.status(403).json({ error: 'Access denied. Employees only.' });
    }
    next();
};
exports.isEmployee = isEmployee;
