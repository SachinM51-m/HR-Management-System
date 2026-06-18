import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { EmployeeData } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle, 
  X, 
  Check, 
  UserPlus, 
  UserCheck2,
  Loader2
} from 'lucide-react';

export const Employees: React.FC = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [salary, setSalary] = useState<string>('');
  const [joiningDate, setJoiningDate] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState<boolean>(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/employees', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load employee records.');
      }

      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading employee database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setName('');
    setEmail('');
    setDepartment('Engineering');
    setPosition('');
    setSalary('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: EmployeeData) => {
    setModalMode('edit');
    setEditingId(emp.id);
    setName(emp.name);
    setEmail(emp.email);
    setDepartment(emp.department);
    setPosition(emp.position);
    setSalary(emp.salary.toString());
    setJoiningDate(emp.joiningDate);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee? This will permanently delete their profile and credentials.')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete employee.');
      }

      // Refresh list
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Error deleting record.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !email || !department || !position || !salary || !joiningDate) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    const parsedSalary = parseFloat(salary);
    if (isNaN(parsedSalary) || parsedSalary < 0) {
      setFormError('Please enter a valid salary amount.');
      return;
    }

    setFormSaving(true);
    try {
      const url = modalMode === 'add' ? '/api/employees' : `/api/employees/${editingId}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          department,
          position,
          salary: parsedSalary,
          joiningDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save employee record.');
      }

      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving.');
    } finally {
      setFormSaving(false);
    }
  };

  // Get distinct departments for dropdown filter
  const departments = Array.from(new Set(employees.map(emp => emp.department)));

  // Filter and Search logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = selectedDept === '' || emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        
        {/* Search & Filter inputs */}
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by name, email, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Department filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-4 py-2 rounded-xl glass-input text-xs shrink-0 cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Add Employee Button */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Employee</span>
        </button>

      </div>

      {/* Main Table Panel */}
      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-405 gap-2">
          <Loader2 size={30} className="animate-spin text-indigo-400" />
          <span className="text-xs font-medium">Syncing employee registry...</span>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 rounded-2xl text-center text-rose-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900/10">
                  <th className="py-4 pl-6">Employee</th>
                  <th className="py-4">Department & Role</th>
                  <th className="py-4">Compensation</th>
                  <th className="py-4">Hire Date</th>
                  <th className="py-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-900/20 transition-colors">
                      
                      {/* Name / Contact info */}
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 font-bold">
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">{emp.name}</p>
                            <p className="text-[10px] text-slate-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department / Position */}
                      <td className="py-4">
                        <p className="font-semibold text-slate-300">{emp.position}</p>
                        <p className="text-[10px] text-slate-500">{emp.department}</p>
                      </td>

                      {/* Salary */}
                      <td className="py-4">
                        <p className="font-bold text-indigo-400">${emp.salary.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Per Month</p>
                      </td>

                      {/* Joining date */}
                      <td className="py-4 text-slate-400 font-medium">
                        {emp.joiningDate}
                      </td>

                      {/* Actions CRUD */}
                      <td className="py-4 pr-6 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-450 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No employee records match the search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Add Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-800 shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-2">
                {modalMode === 'add' ? (
                  <UserPlus size={18} className="text-indigo-400" />
                ) : (
                  <UserCheck2 size={18} className="text-indigo-400" />
                )}
                <h3 className="font-bold text-white text-base">
                  {modalMode === 'add' ? 'Create Employee Profile' : 'Modify Employee Profile'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Johnathan Doe"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                {/* Email */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john.doe@company.com"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="Design">Design</option>
                  </select>
                </div>

                {/* Position */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Position</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Senior Architect"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                {/* Salary */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Base Salary ($/mo)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 5400"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                {/* Joining Date */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {formSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{modalMode === 'add' ? 'Register Profile' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
