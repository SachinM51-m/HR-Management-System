import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  CalendarCheck2, 
  TrendingUp, 
  DollarSign, 
  Briefcase,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

interface DepartmentDist {
  department: string;
  count: number;
  averageSalary: number;
}

interface AttendanceToday {
  totalEmployees: number;
  marked: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  rate: number;
}

interface PayrollStats {
  latestMonth: string | null;
  expense: number;
}

interface PayrollTrend {
  month: string;
  totalPayout: number;
  totalBase: number;
  employeeCount: number;
}

interface DashboardData {
  totalEmployees: number;
  departmentDistribution: DepartmentDist[];
  attendanceToday: AttendanceToday;
  payrollStats: PayrollStats;
  payrollTrends: PayrollTrend[];
}

const COLORS = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics statistics.');
      }

      const resData = await response.json();
      setData(resData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error connecting to analytics services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 size={36} className="animate-spin text-indigo-400" />
        <span className="text-sm font-semibold">Generating analytics nodes...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-rose-400 gap-3">
        <AlertCircle size={36} />
        <span className="text-sm font-semibold">{error || 'Failed to load dashboard data.'}</span>
        <button 
          onClick={fetchDashboardStats}
          className="mt-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Format attendance distribution for BarChart
  const attendanceChartData = [
    { name: 'Present', count: data.attendanceToday.present, fill: '#10b981' },
    { name: 'Half-Day', count: data.attendanceToday.halfDay, fill: '#3b82f6' },
    { name: 'Leave', count: data.attendanceToday.leave, fill: '#f59e0b' },
    { name: 'Absent', count: data.attendanceToday.absent, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Metric Card 1 */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Headcount</span>
            <h3 className="text-3xl font-black text-white">{data.totalEmployees}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp size={12} />
              <span>Active directory sync</span>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
            <Users size={24} />
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Attendance</span>
            <h3 className="text-3xl font-black text-white">{data.attendanceToday.rate}%</h3>
            <p className="text-[10px] text-indigo-400 font-semibold">
              <span>{data.attendanceToday.marked} / {data.totalEmployees} employees logged</span>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            <CalendarCheck2 size={24} />
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Payroll</span>
            <h3 className="text-3xl font-black text-white">
              ${data.payrollStats.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              <span>Month: {data.payrollStats.latestMonth || 'N/A'}</span>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Business Units</span>
            <h3 className="text-3xl font-black text-white">{data.departmentDistribution.length}</h3>
            <p className="text-[10px] text-pink-400 font-semibold">
              <span>Allocated departments</span>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/25 text-pink-400">
            <Briefcase size={24} />
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payroll Area Chart (Left 2 columns) */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div>
            <h4 className="font-bold text-white text-base">Payroll & Compensation Trend</h4>
            <p className="text-xs text-slate-500 mt-1">Aggregated net take-home salary payouts vs base salaries (6 months)</p>
          </div>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.payrollTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }} 
                  labelClassName="font-bold text-indigo-400"
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="totalPayout" name="Net Payroll ($)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPayout)" />
                <Area type="monotone" dataKey="totalBase" name="Base Salaries ($)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorBase)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution Donut Chart (Right 1 column) */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div>
            <h4 className="font-bold text-white text-base">Department Distribution</h4>
            <p className="text-xs text-slate-500 mt-1">Active employee resource allocation by division</p>
          </div>
          <div className="h-60 w-full relative flex items-center justify-center">
            {data.departmentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.departmentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="department"
                  >
                    {data.departmentDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No department breakdown loaded.</div>
            )}
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white">{data.totalEmployees}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Resources</span>
            </div>
          </div>
          {/* Custom Legends */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data.departmentDistribution.map((dept, index) => (
              <div key={dept.department} className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-slate-400 text-[11px] truncate">{dept.department}</span>
                <span className="font-semibold text-slate-200 text-[11px]">({dept.count})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance stats (Left 1 column) */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div>
            <h4 className="font-bold text-white text-base">Attendance Status today</h4>
            <p className="text-xs text-slate-500 mt-1">Breakdown of resource logs for the current business date</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#475569" />
                <YAxis stroke="#475569" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f1f5f9' }} 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {attendanceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Unit Comp (Right 2 columns) */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div>
            <h4 className="font-bold text-white text-base">Department Salaries Overview</h4>
            <p className="text-xs text-slate-500 mt-1">Average compensation distribution across internal business units</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="pb-3.5 pl-2">Business Department</th>
                  <th className="pb-3.5">FTE count</th>
                  <th className="pb-3.5">Average Salary (Take-Home)</th>
                  <th className="pb-3.5 pr-2 text-right">Projected Yearly Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {data.departmentDistribution.map((dept) => (
                  <tr key={dept.department} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-3.5 pl-2 font-semibold text-slate-200">{dept.department}</td>
                    <td className="py-3.5 font-medium text-slate-400">{dept.count} FTEs</td>
                    <td className="py-3.5 font-bold text-indigo-400">${dept.averageSalary.toLocaleString()} / mo</td>
                    <td className="py-3.5 pr-2 font-semibold text-slate-200 text-right">
                      ${(dept.averageSalary * dept.count * 12).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
