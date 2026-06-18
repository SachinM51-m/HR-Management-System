# Nexus HRMS (Human Resource Management System)

An enterprise-grade **Human Resource Management System (HRMS)** built with a modern, responsive developer-centric stack. Nexus HRMS provides automated attendance tracking, monthly payroll management, business division analytics, and dedicated portals for both HR Admins and Employees.

---

## 🚀 Key Features

### 👑 HR Administrator Portal
- **Interactive Analytics Dashboard**: Live metrics on headcounts, today's attendance rates, monthly expenses, business division ratios, and 6-month historical trends.
- **Employee Directory**: Complete CRUD operations to register, modify, or terminate employee profiles and update their system log accounts.
- **Attendance Tracker**: Calendar views, daily attendance status logging (`present`, `absent`, `half_day`, `leave`), and bulk upsert operations.
- **Payroll Ledger**: Recompute monthly payroll distributions automatically based on employee attendance records, track bonuses or deductions, and mark payouts.

### 👤 Employee Portal
- **Personal Dashboard**: Fast overview of profile details, current position, department, and salary.
- **Attendance Calendar**: Monthly breakdown of logged attendance records to trace check-in history.
- **Pay slips**: Retrieve full breakdown of base salary, deductions, and bonuses, with direct print-to-PDF options.

---

## 📂 Project Structure

```text
hrms/
├── backend/                  # Express + TypeScript Server
│   ├── src/
│   │   ├── middleware/       # Auth validation middleware (requireAuth, isAdmin)
│   │   ├── models/           # Sequelize Models (Employee, User, Attendance, Payroll)
│   │   ├── routes/           # REST endpoints split by resource
│   │   ├── seed.ts           # Pre-populates the database
│   │   └── server.ts         # Backend entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Vite + React + TypeScript Client
│   ├── src/
│   │   ├── components/       # Layout parts (Sidebar, Navbar, PaySlipModal)
│   │   ├── context/          # State management (AuthContext)
│   │   ├── pages/            # View routers (Dashboard, Attendance, Payroll, Portal, Login)
│   │   ├── App.tsx           # Global router and views compiler
│   │   └── index.css         # Global design systems and custom glassmorphism utilities
│   ├── package.json
│   └── vite.config.ts        # Configures client dev server & API proxy
└── database.sqlite           # SQLite relational database
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (comes packaged with Node.js)

### 1. Installation
Clone the repository and install dependencies for both the backend and frontend services:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Seeding
Initialize your local SQLite database and pre-populate it with mock employees, 3 months of daily attendance logs, and payroll runs:

```bash
# Inside the /backend directory
npm run seed
```

### 3. Run Development Servers
Open two terminal windows to run both services simultaneously:

#### Run Backend Server:
```bash
# Inside the /backend directory
npm run dev
```
*The backend server will run on [http://localhost:5000](http://localhost:5000).*

#### Run Frontend Dev Server:
```bash
# Inside the /frontend directory
npm run dev
```
*The React client will boot on [http://localhost:3000](http://localhost:3000), automatic proxying requests under `/api` to the backend.*

---

## 🔑 Demo Credentials

After running `npm run seed`, you can authenticate using these preconfigured accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **HR Admin** | `admin@company.com` | `adminpassword` | Full system control |
| **Employee** | `john.doe@company.com` | `employeepassword` | Lead Architect account |
| **Employee** | `jane.smith@company.com` | `employeepassword` | Senior Frontend Developer account |
| **Employee** | `alice.johnson@company.com` | `employeepassword` | HR Manager account |

---

## ⚙️ Payroll Calculation Logic
Monthly payroll calculations dynamically compute earnings based on logged attendance:
- **Base Salary**: Taken from the Employee profile.
- **Expected Working Days**: Evaluated as a standard of **22 business days** per month.
- **Deduction Rule**: 
  - `absent`: Deducts **1 full day** of compensation.
  - `half_day`: Deducts **0.5 days** of compensation.
  - `leave` (Paid leaves): **$0 deduction**.
  - No logs: Defaults to 100% attendance (no deductions).
- **Net Payout Formula**:
  $$\text{Net Salary} = \text{Base Salary} - \text{Total Deductions (Attendance + Manual)} + \text{Bonus}$$
