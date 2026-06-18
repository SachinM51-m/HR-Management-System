import { sequelize, User, Employee, Attendance, Payroll } from './models';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

async function seed() {
  try {
    console.log('Starting database seeding...');
    // Re-create all tables
    await sequelize.sync({ force: true });
    console.log('Database tables cleared and recreated.');

    // 1. Create Admin User
    const adminPasswordHash = await bcrypt.hash('adminpassword', 10);
    await User.create({
      email: 'admin@company.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      employeeId: null,
    });
    console.log('Admin account created: admin@company.com / adminpassword');

    // 2. Create Employees
    const employeeData = [
      {
        name: 'John Doe',
        email: 'john.doe@company.com',
        department: 'Engineering',
        position: 'Lead Architect',
        salary: 8500,
        joiningDate: '2024-01-15',
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        department: 'Engineering',
        position: 'Senior Frontend Developer',
        salary: 6800,
        joiningDate: '2024-03-10',
      },
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@company.com',
        department: 'Human Resources',
        position: 'HR Manager',
        salary: 5800,
        joiningDate: '2023-11-01',
      },
      {
        name: 'Bob Brown',
        email: 'bob.brown@company.com',
        department: 'Sales',
        position: 'Account Executive',
        salary: 4900,
        joiningDate: '2025-02-20',
      },
      {
        name: 'Charlie Green',
        email: 'charlie.green@company.com',
        department: 'Marketing',
        position: 'Content Specialist',
        salary: 4500,
        joiningDate: '2025-05-15',
      },
    ];

    const employees = [];
    const empPasswordHash = await bcrypt.hash('employeepassword', 10);

    for (const emp of employeeData) {
      const newEmp = await Employee.create({
        ...emp,
        status: 'active',
      });
      employees.push(newEmp);

      // Create corresponding Employee User Login
      await User.create({
        email: newEmp.email,
        passwordHash: empPasswordHash,
        role: 'employee',
        employeeId: newEmp.id,
      });
    }
    console.log(`Created ${employees.length} employees and their associated employee logins (password: employeepassword).`);

    // 3. Generate Attendance Records for 3 Months (March, April, May 2026)
    // We will generate weekday logs for each employee
    const months = [
      { year: 2026, month: 3, days: 31, name: '03' },
      { year: 2026, month: 4, days: 30, name: '04' },
      { year: 2026, month: 5, days: 31, name: '05' },
    ];

    console.log('Generating daily attendance records (weekdays only)...');
    
    // Status distribution: 90% present, 4% leave, 3% half_day, 3% absent
    const getStatus = () => {
      const rand = Math.random();
      if (rand < 0.90) return 'present';
      if (rand < 0.94) return 'leave';
      if (rand < 0.97) return 'half_day';
      return 'absent';
    };

    for (const emp of employees) {
      for (const m of months) {
        for (let d = 1; d <= m.days; d++) {
          const dateStr = `${m.year}-${m.name}-${d.toString().padStart(2, '0')}`;
          const dateObj = new Date(dateStr);
          const dayOfWeek = dateObj.getDay();

          // Skip Saturday (6) and Sunday (0)
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            await Attendance.create({
              employeeId: emp.id,
              date: dateStr,
              status: getStatus(),
            });
          }
        }
      }
    }
    console.log('Attendance generation completed.');

    // 4. Calculate and Seeding Payroll Records for these 3 months
    console.log('Generating payroll statements based on attendance...');
    const expectedWorkingDays = 22;

    for (const m of months) {
      const monthStr = `${m.year}-${m.name}`;
      
      for (const emp of employees) {
        // Query employee attendance for this month
        const records = await Attendance.findAll({
          where: {
            employeeId: emp.id,
            date: {
              [Op.like]: `${monthStr}%`,
            },
          },
        });

        let present = 0;
        let absent = 0;
        let halfDay = 0;
        let leave = 0;

        records.forEach((r) => {
          if (r.status === 'present') present++;
          else if (r.status === 'absent') absent++;
          else if (r.status === 'half_day') halfDay++;
          else if (r.status === 'leave') leave++;
        });

        const baseSalary = emp.salary;
        const totalDeductedDays = absent + halfDay * 0.5;
        const attendanceDeduction = Math.round(((baseSalary / expectedWorkingDays) * totalDeductedDays) * 100) / 100;
        
        // Random bonus / slight deduction adjustments
        const bonus = Math.random() > 0.7 ? 200 : 0;
        const deductions = attendanceDeduction;
        const netSalary = Math.round((baseSalary - deductions + bonus) * 100) / 100;

        // Payroll status is marked as 'paid' for March and April, 'unpaid' for May (representing the current unpaid run)
        const status = m.month < 5 ? 'paid' : 'unpaid';
        const paidAt = status === 'paid' ? `${m.year}-${m.name}-28` : null;

        await Payroll.create({
          employeeId: emp.id,
          month: monthStr,
          baseSalary,
          deductions,
          bonus,
          netSalary,
          status,
          paidAt,
        });
      }
    }

    console.log('Payroll seeding completed.');
    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
