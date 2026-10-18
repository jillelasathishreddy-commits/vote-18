import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, Mail, Phone, AlertCircle, Loader2, Sparkles, Key } from 'lucide-react';

export default function AuthModal({ onLoginSuccess }) {
  const { authModalOpen, authInitialMode, authInitialRole, closeAuthModal, login } = useAuth();

  const [mode, setMode] = useState(authInitialMode || 'login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState(authInitialRole || 'user'); // 'user' | 'admin'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    adminCode: 'ECI-ADMIN-2026',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(authInitialMode);
    setSelectedRole(authInitialRole);
    setError('');
  }, [authModalOpen, authInitialMode, authInitialRole]);

  if (!authModalOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  // Demo Autofill helpers
  const handleQuickFillCitizen = () => {
    setSelectedRole('user');
    setFormData({
      name: 'Citizen Applicant',
      email: 'user@vote18.in',
      password: 'user123',
      mobile: '9848012345',
      adminCode: '',
    });
    setError('');
  };

  const handleQuickFillAdmin = () => {
    setSelectedRole('admin');
    setFormData({
      name: 'Chief Electoral Officer',
      email: 'admin@vote18.in',
      password: 'admin123',
      mobile: '9876543210',
      adminCode: 'ECI-ADMIN-2026',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? {
              email: formData.email,
              password: formData.password,
              expectedRole: selectedRole,
            }
          : {
              name: formData.name,
              email: formData.email,
              password: formData.password,
              role: selectedRole,
              mobile: formData.mobile,
              adminCode: selectedRole === 'admin' ? formData.adminCode : '',
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed.');
      }

      login(data.user, data.token);
      if (onLoginSuccess) {
        onLoginSuccess(data.user.role);
      }
    } catch (err) {
      setError(err.message || 'Server error during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-stone-200">
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 text-lg cursor-pointer p-1"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
            <span className="font-bold text-lg text-stone-900">Vote 18 System</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            {mode === 'login' ? 'Sign In to Vote 18' : 'Create a Vote 18 Account'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Access citizen voter application or administrative approval portal.
          </p>
        </div>

        {/* Role Selection Toggle */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 text-center mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('user');
                setError('');
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'user'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Citizen / Applicant</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setError('');
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin / Officer</span>
            </button>
          </div>
        </div>

        {/* 1-Click Quick Fill Buttons */}
        <div className="mb-6 p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
          <div className="text-[11px] text-stone-400 font-medium mb-1.5 text-center">
            Demo Credentials (1-Click Fill):
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleQuickFillCitizen}
              className="flex-1 py-1.5 px-2 bg-white hover:bg-stone-100 border border-stone-300 rounded text-[11px] font-semibold text-stone-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-[#EA580C]" />
              <span>Demo Citizen</span>
            </button>
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              className="flex-1 py-1.5 px-2 bg-white hover:bg-stone-100 border border-stone-300 rounded text-[11px] font-semibold text-emerald-800 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3 text-emerald-600" />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name (Optional)"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-stone-800"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@vote18.in"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-stone-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-stone-800"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9848012345"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-stone-800"
                />
              </div>
            </div>
          )}

          {mode === 'register' && selectedRole === 'admin' && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Admin Passcode (Demo: ECI-ADMIN-2026)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="adminCode"
                  value={formData.adminCode}
                  onChange={handleChange}
                  placeholder="ECI-ADMIN-2026"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-stone-800 font-mono"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {mode === 'login'
                ? `Sign In as ${selectedRole === 'admin' ? 'Officer / Admin' : 'Citizen'}`
                : `Register as ${selectedRole === 'admin' ? 'Officer / Admin' : 'Citizen'}`}
            </span>
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 text-center text-xs text-stone-500">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="font-semibold text-[#EA580C] hover:underline cursor-pointer"
              >
                Register
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="font-semibold text-[#EA580C] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
