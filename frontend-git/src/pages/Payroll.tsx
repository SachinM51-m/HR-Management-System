import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PaySlipModal } from '../components/PaySlipModal';
import type { PayrollRecord } from '../components/PaySlipModal';
import { 
  Calculator, 
  DollarSign, 
  CheckCircle, 
  Eye, 
  AlertCircle,
  Loader2,
  Check,
  Search
} from 'lucide-react';

export const Payroll: React.FC = () => {
  const { token } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Month selection (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().split('-').slice(0, 2).join('-') // YYYY-MM
  );

  // Calculation parameters
  const [bonusInput, setBonusInput] = useState<string>('0');
  const [deductionInput, setDeductionInput] = useState<string>('0');
  const [calculating, setCalculating] = useState<boolean>(false);
  const [calcSuccess, setCalcSuccess] = useState<boolean>(false);

  // Modal integration
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState<boolean>(false);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/payroll?month=${selectedMonth}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load payroll directory.');
      }

      const data = await response.json();
      setPayrollRecords(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading payroll details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [selectedMonth, token]);

  const handleCalculatePayroll = async () => {
    setCalculating(true);
    setCalcSuccess(false);
    setError(null);
    try {
      const response = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          month: selectedMonth,
          bonus: parseFloat(bonusInput) || 0,
          deductions: parseFloat(deductionInput) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run payroll calculations.');
      }

      setCalcSuccess(true);
      setTimeout(() => setCalcSuccess(false), 3000);
      fetchPayroll();
    } catch (err: any) {
      setError(err.message || 'Error running payroll calculations.');
    } finally {
      setCalculating(false);
    }
  };

  const handleMarkAsPaid = async (payrollId: number) => {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/pay`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to process payment status.');
      }

      fetchPayroll();
    } catch (err: any) {
      alert(err.message || 'Error occurred while paying.');
    }
  };

  const handleOpenSlip = (rec: PayrollRecord) => {
    setSelectedRecord(rec);
    setIsSlipOpen(true);
  };

  const totalPayoutSum = payrollRecords.reduce((sum, rec) => sum + rec.netSalary, 0);
  const unpaidCount = payrollRecords.filter(rec => rec.status === 'unpaid').length;

  const filteredRecords = payrollRecords.filter(rec => 
    rec.employee?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.employee?.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-450 text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Configuration panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Run Payroll Form */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calculator className="text-indigo-400" size={18} />
            <h4 className="font-bold text-white text-sm">Salary Run Operations</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Target month */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payroll Period</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input cursor-pointer"
              />
            </div>
            
            {/* Global Bonus adjustment */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Flat Bonus Adjust ($)</label>
              <input
                type="number"
                min="0"
                value={bonusInput}
                onChange={(e) => setBonusInput(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl glass-input"
              />
            </div>

            {/* Global manual deductions adjustment */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Extra Deduct Adjust ($)</label>
              <input
                type="number"
                min="0"
                value={deductionInput}
                onChange={(e) => setDeductionInput(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl glass-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[10px] text-slate-500 max-w-sm">
              Note: Attendance-based deductions are computed automatically. Flat bonus/deductions apply globally to all calculations.
            </p>
            <div className="flex items-center gap-3">
              {calcSuccess && (
                <span className="text-emerald-450 text-xs font-semibold animate-pulse">Calculations updated!</span>
              )}
              <button
                type="button"
                onClick={handleCalculatePayroll}
                disabled={calculating}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                {calculating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Calculator size={13} />
                )}
                <span>Run/Recalculate Period</span>
              </button>
            </div>
          </div>
        </div>

        {/* Period Summary Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <DollarSign className="text-indigo-400" size={18} />
            <h4 className="font-bold text-white text-sm">Period Financials</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Total Month Projection:</span>
              <strong className="text-white">${totalPayoutSum.toLocaleString(undefined, {minimumFractionDigits:2})}</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Calculated Records:</span>
              <strong className="text-slate-200">{payrollRecords.length} employees</strong>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Pending Approvals:</span>
              <strong className={unpaidCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>{unpaidCount} unpaid</strong>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-500 italic">
            Month: {selectedMonth}
          </div>
        </div>

      </div>

      {/* Main Table */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search employee or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={30} className="animate-spin text-indigo-400" />
            <span className="text-xs font-semibold">Updating ledger records...</span>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900/10">
                    <th className="py-4 pl-6">Employee</th>
                    <th className="py-4">Base Salary</th>
                    <th className="py-4">Bonus / Deduct</th>
                    <th className="py-4">Net Payout</th>
                    <th className="py-4">Status</th>
                    <th className="py-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-900/20 transition-colors">
                        
                        {/* Employee info */}
                        <td className="py-4 pl-6">
                          <div>
                            <p className="font-bold text-slate-200">{rec.employee?.name}</p>
                            <p className="text-[10px] text-slate-500">{rec.employee?.position} • {rec.employee?.department}</p>
                          </div>
                        </td>

                        {/* Base Salary */}
                        <td className="py-4 text-slate-400 font-medium">
                          ${rec.baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>

                        {/* Bonus / Deductions */}
                        <td className="py-4">
                          <span className="text-emerald-450 font-semibold">+{rec.bonus}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-rose-450 font-semibold">-{rec.deductions}</span>
                        </td>

                        {/* Net salary */}
                        <td className="py-4 font-bold text-indigo-400">
                          ${rec.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>

                        {/* Payment Status badge */}
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            rec.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {rec.status === 'paid' && <Check size={10} />}
                            <span>{rec.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 pr-6 text-right">
                          <div className="inline-flex gap-2">
                            {rec.status === 'unpaid' && (
                              <button
                                onClick={() => handleMarkAsPaid(rec.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all cursor-pointer shadow shadow-emerald-600/10"
                              >
                                <CheckCircle size={12} />
                                <span>Release Pay</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenSlip(rec)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-slate-100 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              <Eye size={12} />
                              <span>View Slip</span>
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No payroll records found for this period. Run a calculation above.
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
