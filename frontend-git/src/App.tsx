import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Attendance } from './pages/Attendance';
import { Payroll } from './pages/Payroll';
import { EmployeePortal } from './pages/EmployeePortal';
import { Loader2 } from 'lucide-react';

const WorkspaceContent: React.FC = () => {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Automatically enforce view constraints based on role
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('portal');
      }
    }
  }, [isAuthenticated, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 size={40} className="animate-spin text-indigo-400" />
        <h3 className="text-sm font-semibold tracking-wider font-sans uppercase">Nexus HRMS Loading...</h3>
      </div>
    );
  }

  // Not logged in -> Show login view
  if (!isAuthenticated) {
    return <Login />;
  }

  // Logged in -> Show dashboard layout
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return isAdmin ? <Dashboard /> : <EmployeePortal />;
      case 'employees':
        return isAdmin ? <Employees /> : <EmployeePortal />;
      case 'attendance':
        return isAdmin ? <Attendance /> : <EmployeePortal />;
      case 'payroll':
        return isAdmin ? <Payroll /> : <EmployeePortal />;
      case 'portal':
        return <EmployeePortal />;
      default:
        return isAdmin ? <Dashboard /> : <EmployeePortal />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background design accents */}
      <div className="fixed inset-0 gradient-bg pointer-events-none z-0" />

      {/* Sidebar navigation */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main dashboard content workspace */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen z-10 relative">
        {/* Top header navbar */}
        <Navbar currentView={currentView} />

        {/* View container */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderCurrentView()}
          </div>
        </main>
      </div>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <WorkspaceContent />
    </AuthProvider>
  );
};

export default App;
