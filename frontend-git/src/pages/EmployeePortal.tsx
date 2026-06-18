import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PaySlipModal } from '../components/PaySlipModal';
import type { PayrollRecord } from '../components/PaySlipModal';
import { 
  User, 
  CalendarRange, 
  CreditCard, 
  Eye, 
  Loader2,
  CalendarDays,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'leave';
}

export const EmployeePortal: React.FC = () => {
  const { user, token } = useAuth();
  
  // Attendance history state
  const [attendanceMonth, setAttendanceMonth] = useState<string>(
    new Date().toISOString().split('-').slice(0, 2).join('-') // YYYY-MM
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(true);

  // Payroll history state
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState<boolean>(true);

  // Pay Slip Modal
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState<boolean>(false);

  const fetchAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const response = await fetch(`/api/attendance/my?month=${attendanceMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      }
    } catch (err) {
      console.error('Failed to load my attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchPayroll = async () => {
    try {
      setLoadingPayroll(true);
      const response = await fetch('/api/payroll/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPayrolls(data);
      }
    } catch (err) {
      console.error('Failed to load my payroll:', err);
    } finally {
      setLoadingPayroll(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAttendance();
      fetchPayroll();
    }
  }, [token, attendanceMonth]);

  const handleOpenSlip = (rec: PayrollRecord) => {
    // Inject current employee details since backend includes them but double-check association
    const recWithEmp = {
      ...rec,
      employee: user?.employee || undefined
    };
    setSelectedRecord(recWithEmp);
    setIsSlipOpen(true);
  };

  // Calculate attendance counters
  const totalLogged = attendance.length;
  const presents = attendance.filter(r => r.status === 'present').length;
  const halfDays = attendance.filter(r => r.status === 'half_day').length;
  const leaves = attendance.filter(r => r.status === 'leave').length;
  const absents = attendance.filter(r => r.status === 'absent').length;

  const attendancePercentage = totalLogged > 0
    ? Math.round(((presents + halfDays * 0.5 + leaves) / totalLogged) * 100)
    : 100;

  const employee = user?.employee;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner Card */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-500/10 shadow-[0_4px_30px_rgba(99,102,241,0.05)]">
        {/* Background glow decorator */}
        <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-gradient-to-tr from-indigo-500/10 to-pink-500/10 filter blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/10">
            {employee?.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">Hello, {employee?.name}!</h2>
              <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Welcome to your employee self-service desk.</p>
          </div>
        </div>

        <div className="flex gap-2 items-center text-xs text-slate-400 relative z-10 px-4 py-2 bg-slate-900/40 rounded-xl border border-slate-800">
          <Clock size={14} className="text-indigo-400" />
          <span>Last sync: Real-time active session</span>
        </div>
      </div>

      {/* Profile & Personal Attendance metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Employment profile details card */}
        <div className="glass-panel p-6 rounded-2xl space-y-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="text-indigo-400" size={18} />
            <h4 className="font-bold text-white text-sm">Employment Profile</h4>
          </div>

          <div className="space-y-3.5 text-xs flex-1 py-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Designation / Role:</span>
              <strong className="text-slate-200">{employee?.position}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Internal Division:</span>
              <strong className="text-slate-200">{employee?.department}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Joined Organization:</span>
              <strong className="text-slate-200">{employee?.joiningDate}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payroll Contract Rate:</span>
              <strong className="text-indigo-400">${employee?.salary.toLocaleString()} / mo</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Corporate Email:</span>
              <strong className="text-slate-200">{employee?.email}</strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-slate-400">
            <ShieldCheck size={14} className="text-indigo-400 shrink-0" />
            <span>Profile verified by HR Directory services.</span>
          </div>
        </div>

        {/* Attendance stats ring/card */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-2 flex flex-col justify-between">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CalendarRange className="text-indigo-400" size={18} />
              <h4 className="font-bold text-white text-sm">Attendance Summary</h4>
            </div>
            <input
              type="month"
              value={attendanceMonth}
              onChange={(e) => setAttendanceMonth(e.target.value)}
              className="px-3 py-1 rounded-xl glass-input text-xs cursor-pointer"
            />
          </div>

          {loadingAttendance ? (
            <div className="h-40 flex items-center justify-center text-slate-400">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-2">
              
              {/* Circular percentage ring (represented cleanly) */}
              <div className="flex flex-col items-center justify-center space-y-2 py-4">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {/* Outer circle */}
                  <div className="w-full h-full rounded-full border-4 border-slate-800" />
                  {/* Progress overlay */}
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-r-transparent animate-spin-slow pointer-events-none" />
                  
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-white">{attendancePercentage}%</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Attendance</span>
                  </div>
                </div>
              </div>

              {/* Attendance counters */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-4 text-xs">
                
                {/* Present card */}
                <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Present</span>
                  <h5 className="text-lg font-black text-emerald-400 mt-1">{presents} Days</h5>
                </div>

                {/* Leave card */}
                <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Paid Leaves</span>
                  <h5 className="text-lg font-black text-amber-400 mt-1">{leaves} Days</h5>
                </div>

                {/* Half Day card */}
                <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Half-Days</span>
                  <h5 className="text-lg font-black text-blue-400 mt-1">{halfDays} Days</h5>
                </div>

                {/* Absent card */}
                <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Absent</span>
                  <h5 className="text-lg font-black text-rose-455 mt-1">{absents} Days</h5>
                </div>

              </div>

            </div>
          )}

          <div className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-900/20 px-3 py-2 rounded-lg">
            <CalendarDays size={12} className="text-indigo-400" />
            <span>Total logging days logged: {totalLogged} weekdays this month.</span>
          </div>

        </div>

      </div>

      {/* Salary history table */}
      <div className="space-y-4">
        
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <CreditCard className="text-indigo-400" size={18} />
          <h4 className="font-bold text-white text-base font-sans">Payment & Salary History</h4>
        </div>

        {loadingPayroll ? (
          <div className="min-h-[20vh] flex items-center justify-center text-slate-400">
            <Loader2 size={24} className="animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900/10">
                    <th className="py-4 pl-6">Pay Period</th>
                    <th className="py-4">Base Contract Rate</th>
                    <th className="py-4">Earnings / Deduct</th>
                    <th className="py-4">Net Payout</th>
                    <th className="py-4">Status</th>
                    <th className="py-4 pr-6 text-right">Statements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {payrolls.length > 0 ? (
                    payrolls.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 pl-6 font-bold text-slate-200">
                          {rec.month}
                        </td>
                        <td className="py-4 text-slate-400 font-medium">
                          ${rec.baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                        <td className="py-4">
                          <span className="text-emerald-450 font-semibold">+{rec.bonus}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-rose-455 font-semibold">-{rec.deductions}</span>
                        </td>
                        <td className="py-4 font-bold text-indigo-400">
                          ${rec.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            rec.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-4 pr-6 text-right">
                          <button
                            onClick={() => handleOpenSlip(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-slate-100 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Inspect PaySlip</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No processed payroll history available on your account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Slip Modal Component */}
      <PaySlipModal 
        isOpen={isSlipOpen} 
        onClose={() => {
          setIsSlipOpen(false);
          setSelectedRecord(null);
        }} 
        record={selectedRecord} 
      />

    </div>
  );
};
