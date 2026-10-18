import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import TopBanner from './components/TopBanner';
import Navbar from './components/Navbar';
import ApplyPage from './pages/ApplyPage';
import TrackPage from './pages/TrackPage';
import AdminPage from './pages/AdminPage';
import AuthModal from './pages/AuthModal';
import { ExternalLink } from 'lucide-react';

function AppContent() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    // If returning user is admin, default to admin tab; otherwise use saved or 'apply'
    const saved = sessionStorage.getItem('vote18_active_tab');
    if (saved) return saved;
    try {
      const savedUser = JSON.parse(localStorage.getItem('vote18_user') || '{}');
      if (savedUser?.role === 'admin') return 'admin';
    } catch {
      // ignore
    }
    return 'apply';
  });
  const [trackRefId, setTrackRefId] = useState('');

  // Persist tab
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    sessionStorage.setItem('vote18_active_tab', newTab);
  };

  const handleTrackNow = (refId) => {
    setTrackRefId(refId);
    handleTabChange('track');
  };

  // If user is admin and was on apply, or just logged in as admin, switch to admin
  React.useEffect(() => {
    if (isAdmin && activeTab === 'apply') {
      const saved = sessionStorage.getItem('vote18_active_tab');
      if (!saved || saved === 'apply') {
        handleTabChange('admin');
      }
    }
  }, [isAdmin]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-stone-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* 1. Academic Prototype Top Banner */}
      <TopBanner />

      {/* 2. Main Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* 3. Main Views */}
      <main className="flex-1 pb-16">
        {activeTab === 'apply' && <ApplyPage onTrackNow={handleTrackNow} />}
        {activeTab === 'track' && <TrackPage initialRefId={trackRefId} />}
        {activeTab === 'admin' && <AdminPage setActiveTab={handleTabChange} />}
      </main>

      {/* 4. Auth Modal for Citizen / Admin Login & Register */}
      <AuthModal onLoginSuccess={(role) => {
        if (role === 'admin') {
          handleTabChange('admin');
        } else {
          handleTabChange('apply');
        }
      }} />

      {/* 5. Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-8 px-6 text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
            <span className="font-bold text-stone-900">Vote 18</span>
            <span>— Smart Voter Registration Civic-Tech System</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://voters.eci.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#EA580C] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Election Commission of India (ECI)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-stone-300">|</span>
            <span>Academic Demonstration Prototype</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
