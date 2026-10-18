import React, { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, Clock, AlertCircle, FileText, User, MapPin, Sparkles, ArrowRight, ShieldCheck, XCircle } from 'lucide-react';
import EpicCard from '../components/EpicCard';
import { useAuth } from '../context/AuthContext';

const STAGES = [
  { key: 'Draft', label: '1. Identity Check' },
  { key: 'Submitted', label: '2. Form 6 Submitted' },
  { key: 'Under Review', label: '3. Field Verification' },
  { key: 'Approved', label: '4. Electoral Decision' },
];

export default function TrackPage({ initialRefId }) {
  const { user, token, isAdmin, quickSwitchRole } = useAuth();
  const [query, setQuery] = useState(initialRefId || '');
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [myApplications, setMyApplications] = useState([]);
  const [activeView, setActiveView] = useState('search'); // 'search' | 'my'
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveMessage, setApproveMessage] = useState('');

  const handleSearch = async (searchId) => {
    const idToSearch = (searchId || query).trim();
    if (!idToSearch) return;

    setLoading(true);
    setError('');
    setApproveMessage('');
    setApplication(null);

    try {
      const res = await fetch(`/api/applications/track/${encodeURIComponent(idToSearch)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No application found with this reference number.');
      }

      setApplication(data.application);
      setActiveView('search');
    } catch (err) {
      setError(err.message || 'Error tracking application.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRefId) {
      handleSearch(initialRefId);
    }
  }, [initialRefId]);

  // Fetch logged in user's applications
  const fetchMyApplications = () => {
    if (token) {
      fetch('/api/applications/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setMyApplications(data.applications || []);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, [token]);

  // Admin Quick Approve helper from tracking page
  const handleAdminApprove = async () => {
    if (!application || !token || !isAdmin) return;
    setApproveLoading(true);
    setApproveMessage('');

    try {
      const res = await fetch(`/api/admin/applications/${application._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'Approved',
          remarks: 'Approved by Electoral Officer via Vote 18 Portal.',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Approval failed.');
      }

      setApproveMessage('Application Approved! Simulated EPIC Voter ID Card generated.');
      setApplication(data.application);
      fetchMyApplications();
    } catch (err) {
      setApproveMessage(`Error: ${err.message}`);
    } finally {
      setApproveLoading(false);
    }
  };

  const getStageIndex = (status) => {
    if (status === 'Submitted') return 1;
    if (status === 'Under Review') return 2;
    if (status === 'Approved' || status === 'Rejected') return 3;
    return 0;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Track Voter Application
        </h1>
        <p className="text-sm text-stone-500 mt-2">
          Real-time tracking of simulated Vote 18 verification, review, and electoral card approval.
        </p>
      </div>

      {/* Tabs if user is logged in */}
      {user && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 bg-stone-100 rounded-lg border border-stone-200 text-xs">
            <button
              onClick={() => setActiveView('search')}
              className={`px-4 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeView === 'search'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Search by Reference ID
            </button>
            <button
              onClick={() => setActiveView('my')}
              className={`px-4 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeView === 'my'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>My Submissions</span>
              {myApplications.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-800 text-[10px]">
                  {myApplications.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* View: My Applications */}
      {activeView === 'my' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200/80 p-6 shadow-xs">
            <h2 className="text-base font-semibold text-stone-900 mb-4">
              Applications filed under ({user?.email})
            </h2>

            {myApplications.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-sm">
                No applications submitted under this account yet.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {myApplications.map((app) => (
                  <div key={app._id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900 text-sm">
                          {app.applicationId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            app.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.status === 'Under Review'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : app.status === 'Rejected'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {app.fullName} · {app.assemblyConstituency}, {app.state}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSearch(app.applicationId)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#EA580C] hover:bg-orange-50 border border-orange-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View: Search Box */}
      {activeView === 'search' && (
        <>
          <div className="bg-white rounded-xl border border-stone-200/80 p-6 shadow-xs mb-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter Reference ID (e.g. MAT-2026-10492 or V18-2026-XXXXX)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Track</span>
              </button>
            </form>

            {/* Quick Sample Test Chips */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
              <span className="text-xs text-stone-400">Sample Records:</span>
              <button
                type="button"
                onClick={() => {
                  setQuery('MAT-2026-10492');
                  handleSearch('MAT-2026-10492');
                }}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded-md border border-stone-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                MAT-2026-10492 (Approved)
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuery('MAT-2026-89214');
                  handleSearch('MAT-2026-89214');
                }}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded-md border border-stone-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                MAT-2026-89214 (Under Review)
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuery('MAT-2026-64103');
                  handleSearch('MAT-2026-64103');
                }}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded-md border border-stone-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                MAT-2026-64103 (Submitted)
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 mb-8">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Application Detail View */}
          {application && (
            <div className="space-y-6">
              {/* Status Header Card */}
              <div className="bg-white rounded-xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-100">
                  <div>
                    <span className="text-xs text-stone-400 uppercase tracking-wider block">Reference Number</span>
                    <h2 className="text-xl font-bold font-mono text-stone-900 mt-0.5">
                      {application.applicationId}
                    </h2>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-400 block mb-1">Application State</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        application.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : application.status === 'Under Review'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : application.status === 'Rejected'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {application.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {application.status === 'Under Review' && <Clock className="w-3.5 h-3.5" />}
                      {application.status}
                    </span>
                  </div>
                </div>

                {/* Multi-Stage Progress Timeline */}
                <div className="py-8">
                  <div className="grid grid-cols-4 relative text-center">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-stone-200 z-0" />
                    {STAGES.map((stg, idx) => {
                      const curIndex = getStageIndex(application.status);
                      const isPast = curIndex >= idx;
                      const isCurrent = curIndex === idx;

                      return (
                        <div key={stg.key} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                              application.status === 'Rejected' && idx === 3
                                ? 'bg-red-600 text-white'
                                : isPast
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-stone-400 border border-stone-300'
                            }`}
                          >
                            {application.status === 'Rejected' && idx === 3 ? '✕' : isPast ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-xs mt-2 font-medium ${
                              isCurrent ? 'text-stone-900 font-bold' : isPast ? 'text-stone-700' : 'text-stone-400'
                            }`}
                          >
                            {stg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Workflow Explanation Banner for Citizen vs Admin */}
                {application.status !== 'Approved' && (
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <strong className="font-semibold text-stone-900 block">Pending Electoral Approval:</strong>
                      <span>
                        This card will be officially generated once an Admin reviews and approves it.
                      </span>
                    </div>

                    {/* Role aware action */}
                    {isAdmin ? (
                      <button
                        onClick={handleAdminApprove}
                        disabled={approveLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                      >
                        {approveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        <span>Approve as Admin Now</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await quickSwitchRole('admin');
                        }}
                        className="px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#d65b25] text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Switch to Admin to Approve</span>
                      </button>
                    )}
                  </div>
                )}

                {approveMessage && (
                  <div className="p-3 mb-6 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800">
                    {approveMessage}
                  </div>
                )}

                {/* Status remarks banner */}
                {application.adminRemarks && (
                  <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 mb-6">
                    <strong className="font-semibold text-stone-900">Electoral Officer Remark: </strong>
                    {application.adminRemarks}
                  </div>
                )}

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-stone-100">
                  <div>
                    <span className="text-stone-400 block">Applicant Name</span>
                    <span className="font-semibold text-stone-900 text-sm">{application.fullName}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Identity Verification (Aadhaar)</span>
                    <span className="font-mono font-semibold text-stone-800">XXXX-XXXX-{application.aadhaarLast4}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Assembly Constituency</span>
                    <span className="font-medium text-stone-800">{application.assemblyConstituency}, {application.state}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Age Eligibility</span>
                    <span className="font-medium text-emerald-700">Calculated {application.calculatedAge} yrs (Verified)</span>
                  </div>
                </div>
              </div>

              {/* If Approved, show Simulated EPIC Voter Card */}
              {application.status === 'Approved' && (
                <div>
                  <div className="text-center mb-2">
                    <span className="text-xs uppercase font-semibold text-emerald-700 tracking-wider">
                      ★ Electoral Approval Confirmed — Digital Vote 18 Card Generated ★
                    </span>
                  </div>
                  <EpicCard application={application} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
