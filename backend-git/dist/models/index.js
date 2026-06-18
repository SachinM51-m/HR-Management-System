"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payroll = exports.Attendance = exports.User = exports.Employee = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const path_1 = __importDefault(require("path"));
// Define DB Connection
const dbPath = path_1.default.join(__dirname, '../../../database.sqlite');
exports.sequelize = new sequelize_1.Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false, // Set to console.log to see SQL queries
});
class Employee extends sequelize_1.Model {
}
exports.Employee = Employee;
Employee.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    department: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    position: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    salary: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    joiningDate: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false,
    },
}, {
    sequelize: exports.sequelize,
    tableName: 'employees',
});
class User extends sequelize_1.Model {
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('admin', 'employee'),
        defaultValue: 'employee',
        allowNull: false,
    },
    employeeId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
    },
}, {
    sequelize: exports.sequelize,
    tableName: 'users',
});
class Attendance extends sequelize_1.Model {
}
exports.Attendance = Attendance;
Attendance.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employeeId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id',
        },
    },
    date: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('present', 'absent', 'half_day', 'leave'),
        allowNull: false,
    },
}, {
    sequelize: exports.sequelize,
    tableName: 'attendance',
    // Define a unique index on employeeId + date to avoid duplicate checkins
    indexes: [
        {
            unique: true,
            fields: ['employeeId', 'date'],
        },
    ],
});
class Payroll extends sequelize_1.Model {
}
exports.Payroll = Payroll;
Payroll.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employeeId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id',
        },
    },
    month: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    baseSalary: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    deductions: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0,
    },
    bonus: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0,
    },
    netSalary: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('paid', 'unpaid'),
        defaultValue: 'unpaid',
        allowNull: false,
    },
    paidAt: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: exports.sequelize,
    tableName: 'payroll',
    // Define a unique index on employeeId + month
    indexes: [
        {
            unique: true,
            fields: ['employeeId', 'month'],
        },
    ],
});
// --- Define Associations ---
// User -> Employee (One-to-One / Many-to-One)
User.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', onDelete: 'SET NULL' });
Employee.hasOne(User, { foreignKey: 'employeeId', as: 'user', onDelete: 'SET NULL' });
// Employee -> Attendance (One-to-Many)
Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendanceRecords', onDelete: 'CASCADE' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
// Employee -> Payroll (One-to-Many)
Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrollRecords', onDelete: 'CASCADE' });
Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
