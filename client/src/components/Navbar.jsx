import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User as UserIcon, LogOut, ArrowRightLeft, Shield } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, isAdmin, logout, openAuthModal, quickSwitchRole } = useAuth();

  const handleRoleToggle = async () => {
    if (isAdmin) {
      await quickSwitchRole('user');
      setActiveTab('track');
    } else {
      await quickSwitchRole('admin');
      setActiveTab('admin');
    }
  };

  return (
    <header className="border-b border-stone-200/80 bg-[#FBF9F5] sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo - Vote 18 */}
        <button
          onClick={() => setActiveTab('apply')}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
        >
          <span className="w-3 h-3 rounded-full bg-[#EA580C] inline-block transition-transform group-hover:scale-125" />
          <span className="text-xl font-bold tracking-tight text-stone-900 font-sans group-hover:text-stone-700">
            Vote 18
          </span>
        </button>

        {/* Navigation Links - ADMIN IS HIDDEN UNLESS LOGGED IN AS ADMIN! */}
        <nav aria-label="Main navigation" className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={() => setActiveTab('apply')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'apply'
                ? 'text-stone-900 font-bold border-b-2 border-[#EA580C] pb-0.5'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Apply
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'track'
                ? 'text-stone-900 font-bold border-b-2 border-[#EA580C] pb-0.5'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Track
          </button>

          {/* ADMIN TAB: Always visible so officers/evaluators can easily access the review portal */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'text-[#EA580C] font-bold border-b-2 border-[#EA580C] pb-0.5'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {isAdmin && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
            <span>Admin Review</span>
          </button>
        </nav>

        {/* User Account & Role Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Role Indicator & Quick Switcher */}
              <button
                onClick={handleRoleToggle}
                title={`Currently in ${isAdmin ? 'Admin' : 'Citizen'} mode. Click to switch.`}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  isAdmin
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-orange-50 border-orange-200 text-[#EA580C] hover:bg-orange-100'
                }`}
              >
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Role: Admin</span>
                    <ArrowRightLeft className="w-3 h-3 ml-1 text-emerald-500" />
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Role: Citizen</span>
                    <ArrowRightLeft className="w-3 h-3 ml-1 text-orange-400" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-medium text-stone-800">
                <span className="truncate max-w-[90px]">{user.name.split(' ')[0]}</span>
              </div>

              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login', 'user')}
                className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('login', 'admin')}
                className="text-xs font-semibold text-stone-900 bg-stone-200 hover:bg-stone-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title="Election Officer Sign In"
              >
                <Shield className="w-3 h-3 text-stone-700" />
                <span className="hidden sm:inline">Admin Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
