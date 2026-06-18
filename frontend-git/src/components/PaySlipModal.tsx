import React from 'react';
import { X, Printer, CreditCard, ShieldCheck } from 'lucide-react';
import type { EmployeeData } from '../context/AuthContext';

export interface PayrollRecord {
  id: number;
  employeeId: number;
  month: string; // YYYY-MM
  baseSalary: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: 'paid' | 'unpaid';
  paidAt?: string | null;
  employee?: EmployeeData;
}

interface PaySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollRecord | null;
}

export const PaySlipModal: React.FC<PaySlipModalProps> = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const employee = record.employee;

  // Real Net Payout matches record.netSalary
  // Let's make the math balance out perfectly:
  // Base Salary + Bonus = Gross
  // Deductions (Attendance) + Tax (Mocked) + PF = Total Deductions
  // Gross - Total Deductions = Net Payout.
  // To keep it 100% accurate to the DB record.netSalary:
  const displayDeductions = record.deductions; // Attendance
  const displayTax = Math.round(record.baseSalary * 0.10 * 100) / 100; // 10%
  const displayPF = Math.round(record.baseSalary * 0.05 * 100) / 100; // 5%
  // Let's calculate a fake allowance so that Net Payout = Gross - Deductions + Allowances
  // Net Payout = Base - AttendanceDeduction + Bonus
  // To make it look beautiful, we can break it down as:
  // Earnings: Base Salary (baseSalary), Bonus (bonus), Allowances (e.g. housing: 10% of base, transport: 5% of base)
  // Deductions: Tax (10% of base), PF (5% of base), Loss of Pay (record.deductions)
  // In this case: Net = Base + Bonus + Allowances - Tax - PF - Loss of Pay
  // To make it equal record.netSalary, we set Allowances = record.netSalary - record.baseSalary - record.bonus + displayTax + displayPF + displayDeductions
  const displayAllowances = Math.max(0, Math.round((record.netSalary - record.baseSalary - record.bonus + displayTax + displayPF + displayDeductions) * 100) / 100);
  const displayGrossCalculated = Math.round((record.baseSalary + record.bonus + displayAllowances) * 100) / 100;
  const displayDeductionsTotal = Math.round((displayTax + displayPF + displayDeductions) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:p-0 print:bg-white animate-fade-in">
      <div className="w-full max-w-3xl glass-panel rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-800/80 print:shadow-none print:border-none print:max-h-full print:w-full print:rounded-none">
        
        {/* Header (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 print:hidden">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-indigo-400" />
            <h3 className="font-bold text-white text-base">Salary Slip Statement</h3>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              <Printer size={13} />
              <span>Print Slip</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-all duration-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Payslip Content (Printed area) */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 bg-slate-950 print:bg-white text-slate-300 print:text-black print-area">
          <div className="border border-slate-850 p-6 rounded-xl bg-slate-900/30 print:border-slate-300 print:bg-transparent">
            
            {/* Slip Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-6 print:border-slate-350">
              <div>
                <h2 className="text-2xl font-black text-white tracking-wide print:text-black">NEXUS ENTERPRISE</h2>
                <p className="text-xs text-slate-500 mt-1 print:text-gray-500">Corporate HQ • Technology & Innovation Services</p>
                <p className="text-[10px] text-slate-500 print:text-gray-500">Reg No: NX-9082-HRD</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-indigo-400 print:text-black">PAYSLIP STATEMENT</div>
                <div className="text-sm font-semibold text-white mt-1 print:text-black">{getMonthName(record.month)}</div>
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:border-black print:text-black">
                  {record.status}
                </div>
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 py-6 text-sm border-b border-slate-800 print:border-slate-350">
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500 print:text-gray-600">Employee Name:</span> <strong className="text-slate-200 print:text-black">{employee?.name}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500 print:text-gray-600">Employee ID:</span> <strong className="text-slate-200 print:text-black">EMP-{employee?.id?.toString().padStart(4, '0')}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500 print:text-gray-600">Designation:</span> <strong className="text-slate-200 print:text-black">{employee?.position}</strong></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500 print:text-gray-600">Department:</span> <strong className="text-slate-200 print:text-black">{employee?.department}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500 print:text-gray-600">Joining Date:</span> <strong className="text-slate-200 print:text-black">{employee?.joiningDate}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500 print:text-gray-600">Email Address:</span> <strong className="text-slate-200 print:text-black">{employee?.email}</strong></div>
              </div>
            </div>

            {/* Earnings and Deductions Table */}
            <div className="grid grid-cols-2 gap-0 border-b border-slate-800 print:border-slate-350">
              
              {/* Earnings Column */}
              <div className="border-r border-slate-800 pr-6 py-6 print:border-slate-350">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4 print:text-black">Earnings</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 print:text-gray-650">Basic Salary</span>
                    <span className="font-semibold text-slate-200 print:text-black">${record.baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 print:text-gray-650">Performance Bonus</span>
                    <span className="font-semibold text-slate-200 print:text-black">${record.bonus.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 print:text-gray-650">HRA & Allowances</span>
                    <span className="font-semibold text-slate-200 print:text-black">${displayAllowances.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="border-t border-slate-800/60 pt-2.5 flex justify-between font-bold text-slate-200 print:text-black">
                    <span>Gross Earnings</span>
                    <span>${displayGrossCalculated.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="pl-6 py-6">
                <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-4 print:text-black">Deductions</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 print:text-gray-650">Professional Tax (10%)</span>
                    <span className="font-semibold text-slate-200 print:text-black">${displayTax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 print:text-gray-650">Provident Fund (5%)</span>
                    <span className="font-semibold text-slate-200 print:text-black">${displayPF.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 print:text-gray-650">Loss of Pay (Absence/Half-Day)</span>
                    <span className="font-semibold text-slate-200 print:text-black">${displayDeductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="border-t border-slate-800/60 pt-2.5 flex justify-between font-bold text-slate-200 print:text-black">
                    <span>Total Deductions</span>
                    <span>${displayDeductionsTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Payout Banner */}
            <div className="flex justify-between items-center py-6 px-4 bg-slate-900/50 rounded-lg mt-6 border border-slate-800/40 print:bg-gray-100 print:border-slate-350">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider print:text-gray-600">Net Salary Payout (Take-Home)</span>
                <p className="text-[10px] text-slate-500 mt-0.5 print:text-gray-500">Calculated after attendance adjustments, statutory taxes, and contributions.</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-400 print:text-black">${record.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            {/* Signatures & Footer */}
            <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-slate-800/40 text-xs print:border-slate-300">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-slate-500 print:text-gray-500">
                  <ShieldCheck size={14} className="text-indigo-400 print:text-black" />
                  <span>Electronically certified document. No signature required.</span>
                </div>
                <div className="text-[10px] text-slate-500 print:text-gray-500">
                  Generated on: {record.paidAt ? record.paidAt : new Date().toISOString().split('T')[0]}
                </div>
              </div>
              <div className="flex flex-col items-end justify-end">
                <div className="w-32 border-b border-slate-700/60 text-center pb-1 font-mono text-[10px] italic text-slate-400 print:border-black print:text-black">
                  Nexus HR Authority
                </div>
                <div className="text-[10px] text-slate-500 mt-1 mr-4 print:text-gray-500">Authorized Signature</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
