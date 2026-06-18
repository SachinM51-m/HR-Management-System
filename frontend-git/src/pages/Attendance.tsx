import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  CheckCircle2, 
  Save, 
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and date state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Local modifications during daily log
  const [localStatuses, setLocalStatuses] = useState<Record<number, 'present' | 'absent' | 'half_day' | 'leave'>>({});
  const [savingBulk, setSavingBulk] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'daily' | 'history'>('daily');
  const [historyMonth, setHistoryMonth] = useState<string>(
    new Date().toISOString().split('-').slice(0, 2).join('-') // YYYY-MM
  );
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const loadDailyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch active employees
      const empResponse = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!empResponse.ok) throw new Error('Failed to fetch employee database.');
      const empData = await empResponse.json();
      
      // Filter out inactive employees
      const activeEmps = empData.filter((e: any) => e.status === 'active');
      setEmployees(activeEmps);

      // 2. Fetch attendance for selectedDate
      const attResponse = await fetch(`/api/attendance?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!attResponse.ok) throw new Error('Failed to fetch attendance logs.');
      const attRecords = await attResponse.json();
      setAttendanceRecords(attRecords);

      // 3. Map to localStatuses
      const statusMap: Record<number, 'present' | 'absent' | 'half_day' | 'leave'> = {};
      
      // Set defaults for all employees to 'present'
      activeEmps.forEach((emp: any) => {
        statusMap[emp.id] = 'present';
      });

      // Override with actual database records if present
      attRecords.forEach((rec: any) => {
        statusMap[rec.employeeId] = rec.status;
      });

      setLocalStatuses(statusMap);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading records.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryData = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/attendance?month=${historyMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch monthly attendance history.');
      const data = await response.json();
      setHistoryRecords(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      loadDailyData();
    } else {
      loadHistoryData();
    }
  }, [selectedDate, token, activeTab, historyMonth]);

  const handleStatusChange = (employeeId: number, status: 'present' | 'absent' | 'half_day' | 'leave') => {
    setLocalStatuses(prev => ({
      ...prev,
      [employeeId]: status
    }));
    setSaveSuccess(false);
  };

  const handleSaveBulkAttendance = async () => {
    setSavingBulk(true);
    setSaveSuccess(false);
    try {
      const recordsToPost = Object.entries(localStatuses).map(([employeeId, status]) => ({
        employeeId: parseInt(employeeId),
        date: selectedDate,
        status,
      }));

      const response = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ records: recordsToPost }),
      });

      if (!response.ok) {
        throw new Error('Failed to register attendance batch.');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadDailyData();
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving.');
    } finally {
      setSavingBulk(false);
    }
  };

  // Adjust daily date navigation
  const adjustDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
    setSaveSuccess(false);
  };

  // Search filtering
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-5 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 -mb-px ${
            activeTab === 'daily'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Daily Work logs
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 -mb-px ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Monthly History Reports
        </button>
      </div>

      {activeTab === 'daily' ? (
        /* Daily Attendance Module */
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            {/* Date Selection Scroller */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => adjustDate(-1)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                  <Calendar size={14} />
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl glass-input text-xs cursor-pointer"
                />
              </div>
              <button 
                onClick={() => adjustDate(1)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Save Buttons & Status Messages */}
            <div className="flex items-center justify-end gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold animate-pulse">
                  <CheckCircle2 size={16} />
                  <span>Attendance saved successfully.</span>
                </div>
              )}
              <button
                onClick={handleSaveBulkAttendance}
                disabled={savingBulk || employees.length === 0}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-indigo-600/10"
              >
                {savingBulk ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>Save Logs Batch</span>
              </button>
            </div>

          </div>

          {/* Search bar inside list */}
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

          {/* Main List */}
          {loading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-450 gap-2">
              <Loader2 size={30} className="animate-spin text-indigo-400" />
              <span className="text-xs font-semibold">Generating attendance board...</span>
            </div>
          ) : error ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-rose-400 text-sm">
              {error}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800/60">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const currentStatus = localStatuses[emp.id];
                    return (
                      <div key={emp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/10 transition-colors">
                        
                        {/* Employee Avatar and Identity */}
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-indigo-400 shadow-inner">
                            {emp.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-200 text-sm">{emp.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">{emp.position} • {emp.department}</p>
                          </div>
                        </div>

                        {/* Status Select Buttons */}
                        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                          
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_-3px_rgba(16,185,129,0.2)]'
                                : 'border-slate-800 hover:border-slate-700 bg-slate-900/35 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Present
                          </button>

                          {/* Half Day Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.id, 'half_day')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              currentStatus === 'half_day'
                                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-[0_0_12px_-3px_rgba(59,130,246,0.2)]'
                                : 'border-slate-800 hover:border-slate-700 bg-slate-900/35 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Half-Day
                          </button>

                          {/* Leave Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.id, 'leave')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              currentStatus === 'leave'
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_12px_-3px_rgba(245,158,11,0.2)]'
                                : 'border-slate-800 hover:border-slate-700 bg-slate-900/35 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Paid Leave
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-455 shadow-[0_0_12px_-3px_rgba(244,63,94,0.2)]'
                                : 'border-slate-800 hover:border-slate-700 bg-slate-900/35 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Absent
                          </button>

                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    No active employees registered to mark.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Monthly History Log Module */
        <div className="space-y-6">
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Select Month:</span>
              <input
                type="month"
                value={historyMonth}
                onChange={(e) => setHistoryMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl glass-input text-xs cursor-pointer"
              />
            </div>
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search history by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* History records renderer */}
          {loadingHistory ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-450 gap-2">
              <Loader2 size={30} className="animate-spin text-indigo-400" />
              <span className="text-xs font-semibold">Filtering history logs...</span>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900/10">
                      <th className="py-4 pl-6">Employee</th>
                      <th className="py-4">Log Date</th>
                      <th className="py-4">Designation</th>
                      <th className="py-4">Marked Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs">
                    {historyRecords.length > 0 ? (
                      historyRecords
                        .filter(r => r.employee?.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="py-3.5 pl-6 font-bold text-slate-200">
                              {rec.employee?.name}
                            </td>
                            <td className="py-3.5 text-slate-400 font-medium">
                              {rec.date}
                            </td>
                            <td className="py-3.5 text-slate-500">
                              {rec.employee?.position} • {rec.employee?.department}
                            </td>
                            <td className="py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                rec.status === 'present' ? 'bg-emerald-500/10 text-emerald-450' :
                                rec.status === 'half_day' ? 'bg-blue-500/10 text-blue-450' :
                                rec.status === 'leave' ? 'bg-amber-500/10 text-amber-450' :
                                'bg-rose-500/10 text-rose-450'
                              }`}>
                                {rec.status === 'half_day' ? 'Half-Day' : rec.status}
                              </span>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          No attendance records found for this month.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
