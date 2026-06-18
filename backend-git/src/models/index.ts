import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import path from 'path';

// Define DB Connection
const dbPath = path.join(__dirname, '../../../database.sqlite');
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Set to console.log to see SQL queries
});

// --- Employee Model ---
export interface EmployeeAttributes {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  joiningDate: string; // YYYY-MM-DD
  status: 'active' | 'inactive';
}

export interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, 'id' | 'status'> {}

export class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare department: string;
  declare position: string;
  declare salary: number;
  declare joiningDate: string;
  declare status: 'active' | 'inactive';

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    salary: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    joiningDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'employees',
  }
);

// --- User Model (Auth) ---
export interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  role: 'admin' | 'employee';
  employeeId?: number | null; // Associated employee if role is 'employee'
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'employeeId'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare passwordHash: string;
  declare role: 'admin' | 'employee';
  declare employeeId: number | null;
  declare employee?: Employee | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'employee'),
      defaultValue: 'employee',
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);

// --- Attendance Model ---
export interface AttendanceAttributes {
  id: number;
  employeeId: number;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'half_day' | 'leave';
}

export interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id'> {}

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  declare id: number;
  declare employeeId: number;
  declare date: string;
  declare status: 'present' | 'absent' | 'half_day' | 'leave';

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Attendance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'half_day', 'leave'),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'attendance',
    // Define a unique index on employeeId + date to avoid duplicate checkins
    indexes: [
      {
        unique: true,
        fields: ['employeeId', 'date'],
      },
    ],
  }
);

// --- Payroll Model ---
export interface PayrollAttributes {
  id: number;
  employeeId: number;
  month: string; // YYYY-MM
  baseSalary: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: 'paid' | 'unpaid';
  paidAt?: string | null;
}

export interface PayrollCreationAttributes extends Optional<PayrollAttributes, 'id' | 'deductions' | 'bonus' | 'status' | 'paidAt'> {}

export class Payroll extends Model<PayrollAttributes, PayrollCreationAttributes> implements PayrollAttributes {
  declare id: number;
  declare employeeId: number;
  declare month: string;
  declare baseSalary: number;
  declare deductions: number;
  declare bonus: number;
  declare netSalary: number;
  declare status: 'paid' | 'unpaid';
  declare paidAt: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Payroll.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id',
      },
    },
    month: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    baseSalary: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    deductions: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    bonus: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    netSalary: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('paid', 'unpaid'),
      defaultValue: 'unpaid',
      allowNull: false,
    },
    paidAt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'payroll',
    // Define a unique index on employeeId + month
    indexes: [
      {
        unique: true,
        fields: ['employeeId', 'month'],
      },
    ],
  }
);

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
