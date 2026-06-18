import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, Building2, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Quick sign-in helper
  const handleQuickSignIn = (type: 'admin' | 'employee') => {
    setError(null);
    if (type === 'admin') {
      setEmail('admin@company.com');
      setPassword('adminpassword');
    } else {
      setEmail('john.doe@company.com');
      setPassword('employeepassword');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed.');
      }

      // Automatically log in upon successful signup
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Server error during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-200 bg-slate-950 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Left Panel: Brand presentation */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg relative flex-col justify-between p-12 overflow-hidden border-r border-slate-900">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-500/5 rounded-full filter blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Building2 size={24} className="animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-white tracking-wider text-xl">NEXUS</span>
            <span className="font-semibold text-indigo-400 tracking-widest text-base ml-1">HRMS</span>
          </div>
        </div>

        {/* Center content */}
        <div className="my-auto max-w-lg relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <span>Enterprise Human Resources v2.5</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight">
            Streamline your talent, payroll, and attendance workflows in one place.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Nexus HRMS offers an intuitive, real-time analytics suite with secure role-based portals for administrators and employees alike, modeled after premium ERP solutions.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/60">
            <div>
              <p className="text-2xl font-black text-white">99.8%</p>
              <p className="text-xs text-slate-500 mt-1">Attendance Rate</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">2.5 min</p>
              <p className="text-xs text-slate-500 mt-1">Payroll Cycle</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">Zero</p>
              <p className="text-xs text-slate-500 mt-1">Server Setup</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-600 relative z-10">
          &copy; {new Date().getFullYear()} Nexus Enterprise Systems. All rights reserved. Registered trademark.
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          
          {/* Form Header */}
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight">
              {isLoginView ? 'Welcome Back' : 'Register Account'}
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              {isLoginView 
                ? 'Sign in to access your customized HR workspace.' 
                : 'Create an account to register your workspace.'}
            </p>
          </div>

          {/* Quick Sign-In Toggles (Only on Login) */}
          {isLoginView && (
            <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-slate-900 border border-slate-800/80">
              <button
                type="button"
                onClick={() => handleQuickSignIn('admin')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 hover:border-indigo-500/30 transition-all cursor-pointer"
              >
                <UserCheck size={14} />
                <span>HR Manager Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSignIn('employee')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <UserCheck size={14} />
                <span>Employee Demo</span>
              </button>
            </div>
          )}

          {/* Form Card */}
          <div className="glass-panel p-8 rounded-2xl shadow-xl border border-slate-800">
            <form onSubmit={isLoginView ? handleLoginSubmit : handleSignupSubmit} className="space-y-5">
              
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Corporate Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Secure Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <KeyRound size={16} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              {/* Role Select (Only on Signup) */}
              {!isLoginView && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Account Access Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('employee')}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        role === 'employee'
                          ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        role === 'admin'
                          ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      HR Manager
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/15 hover:shadow-indigo-500/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{isLoginView ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>
          </div>

          {/* Toggle View Link */}
          <div className="text-center text-xs">
            <button
              onClick={() => {
                setError(null);
                setIsLoginView(!isLoginView);
              }}
              className="text-indigo-450 hover:text-indigo-400 font-semibold cursor-pointer underline underline-offset-4"
            >
              {isLoginView 
                ? "Don't have an account? Register here" 
                : "Already have an account? Sign in"}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
