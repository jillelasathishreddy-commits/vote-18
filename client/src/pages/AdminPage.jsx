import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function AdminPage({ setActiveTab }) {
  const { user, token, isAdmin, openAuthModal, quickSwitchRole } = useAuth();

  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateOnly, setDuplicateOnly] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Supporting document mismatch');
  const [message, setMessage] = useState('');

  // Fetch admin dashboard stats & applications
  const fetchData = async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    setFetchError('');
    try {
      // 1. Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // 2. Fetch applications
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
      if (duplicateOnly) queryParams.append('duplicateOnly', 'true');

      const appRes = await fetch(`/api/admin/applications?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const appData = await appRes.json();
      if (appData.success) {
        setApplications(appData.applications || []);
      } else {
        setFetchError(appData.message || 'Failed to retrieve voter applications.');
      }
    } catch (err) {
      console.error('Fetch Admin Data Error:', err);
      setFetchError('Network latency or connection error with MongoDB. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, token, statusFilter, duplicateOnly]);

  // Seed sample applications if needed or missing
  const handleSeedSample = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seed-sample?force=true', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.message) {
        setMessage(data.message);
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      setFetchError('Failed to seed sample applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('All');
    setDuplicateOnly(false);
    setSearchQuery('');
  };

  // Update status (Approve / Reject / Review)
  const handleStatusUpdate = async (newStatus) => {
    if (!selectedApp) return;
    setActionLoading(true);
    setMessage('');

    try {
      const payload = {
        status: newStatus,
        remarks: adminRemarks || `Application marked as ${newStatus} by Electoral Officer.`,
        rejectionReason: newStatus === 'Rejected' ? rejectionReason : '',
      };

      const res = await fetch(`/api/admin/applications/${selectedApp._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update status.');
      }

      setMessage(`Success: Application #${selectedApp.applicationId} marked as ${newStatus}!`);
      setSelectedApp(data.application);
      fetchData();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Guard: if user is not an Admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">
          Officer Portal Restricted
        </h1>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">
          The Admin Review Portal is restricted to Electoral Officers. As a citizen applicant, please use the <strong>Apply</strong> and <strong>Track</strong> pages.
        </p>

        {user && (
          <div className="p-3 bg-stone-100 rounded-lg text-xs text-stone-700 mb-6 border border-stone-200">
            Currently logged in as: <strong className="text-stone-900">{user.name}</strong> ({user.email})<br />
            Role: <span className="font-semibold text-[#EA580C] uppercase">{user.role}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => quickSwitchRole('admin')}
            className="w-full py-2.5 bg-[#EA580C] hover:bg-[#d65b25] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>1-Click Switch to Admin / Officer</span>
          </button>

          <button
            onClick={() => openAuthModal('login', 'admin')}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Sign In with Other Admin Account
          </button>

          {setActiveTab && (
            <button
              onClick={() => setActiveTab('apply')}
              className="w-full py-2 bg-transparent hover:bg-stone-100 text-stone-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              ← Back to Voter Application Form
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Vote 18 — Officer Review Portal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Active Role: <span className="font-semibold text-emerald-800 uppercase">{user.role}</span> · Logged in as {user.name} ({user.email})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Refresh records"
            className="p-2 border border-stone-300 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleSeedSample}
            title="Ensure diverse sample applications exist across all categories"
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg border border-stone-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Seed Full Demo Data</span>
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Interactive Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div
            onClick={() => { setStatusFilter('All'); setDuplicateOnly(false); }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-xs hover:border-stone-400 ${
              statusFilter === 'All' && !duplicateOnly ? 'ring-2 ring-stone-800' : 'border-stone-200/80'
            }`}
          >
            <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block">Total Filed</span>
            <span className="text-2xl font-bold text-stone-900 mt-1 block">{stats.total}</span>
          </div>
          <div
            onClick={() => { setStatusFilter('Submitted'); setDuplicateOnly(false); }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-xs hover:border-blue-400 ${
              statusFilter === 'Submitted' && !duplicateOnly ? 'ring-2 ring-blue-600' : 'border-blue-200/80'
            }`}
          >
            <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider block">Submitted (New)</span>
            <span className="text-2xl font-bold text-blue-800 mt-1 block">{stats.submitted}</span>
          </div>
          <div
            onClick={() => { setStatusFilter('Under Review'); setDuplicateOnly(false); }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-xs hover:border-amber-400 ${
              statusFilter === 'Under Review' && !duplicateOnly ? 'ring-2 ring-amber-600' : 'border-amber-200/80'
            }`}
          >
            <span className="text-[11px] font-medium text-amber-600 uppercase tracking-wider block">Under Review</span>
            <span className="text-2xl font-bold text-amber-800 mt-1 block">{stats.underReview}</span>
          </div>
          <div
            onClick={() => { setStatusFilter('Approved'); setDuplicateOnly(false); }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-xs hover:border-emerald-400 ${
              statusFilter === 'Approved' && !duplicateOnly ? 'ring-2 ring-emerald-600' : 'border-emerald-200/80'
            }`}
          >
            <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">Approved (EPIC)</span>
            <span className="text-2xl font-bold text-emerald-800 mt-1 block">{stats.approved}</span>
          </div>
          <div
            onClick={() => { setStatusFilter('Rejected'); setDuplicateOnly(false); }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-xs hover:border-red-400 ${
              statusFilter === 'Rejected' && !duplicateOnly ? 'ring-2 ring-red-600' : 'border-red-200/80'
            }`}
          >
            <span className="text-[11px] font-medium text-red-600 uppercase tracking-wider block">Rejected</span>
            <span className="text-2xl font-bold text-red-800 mt-1 block">{stats.rejected}</span>
          </div>
          <div
            onClick={() => { setDuplicateOnly(true); setStatusFilter('All'); }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-xs hover:border-orange-400 ${
              duplicateOnly ? 'ring-2 ring-[#EA580C]' : 'border-orange-200/80'
            }`}
          >
            <span className="text-[11px] font-medium text-[#EA580C] uppercase tracking-wider block">Duplicate Flags</span>
            <span className="text-2xl font-bold text-[#EA580C] mt-1 block">{stats.duplicates}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200/70 p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs with live counts */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'All', label: 'All', count: stats?.total },
            { id: 'Submitted', label: 'Submitted', count: stats?.submitted },
            { id: 'Under Review', label: 'Under Review', count: stats?.underReview },
            { id: 'Approved', label: 'Approved', count: stats?.approved },
            { id: 'Rejected', label: 'Rejected', count: stats?.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-stone-900 text-white font-semibold shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    statusFilter === tab.id ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}

          {(statusFilter !== 'All' || duplicateOnly || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs text-[#EA580C] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer font-medium"
            >
              Reset Filters ✕
            </button>
          )}
        </div>

        {/* Duplicate Toggle & Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={duplicateOnly}
              onChange={(e) => setDuplicateOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-stone-300 text-[#EA580C] focus:ring-[#EA580C]"
            />
            <span className="font-medium">Duplicates Only</span>
            {stats?.duplicates > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                {stats.duplicates}
              </span>
            )}
          </label>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              placeholder="Search by name, ID, EPIC..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:outline-none focus:border-stone-800"
            />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-stone-200/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Aadhaar (Last 4)</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Constituency & State</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 text-[#EA580C] animate-spin" />
                      <span className="text-xs font-medium text-stone-600">
                        Retrieving voter applications from MongoDB database...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2">
                        <Search className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-stone-800">
                        No applications found matching current filter
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 mb-4 leading-relaxed">
                        Filter: <span className="font-semibold text-stone-700">{statusFilter}</span>
                        {duplicateOnly && <span className="ml-1 text-amber-700 font-semibold">(Duplicates Only)</span>}
                        {searchQuery && <span className="ml-1 text-stone-700 font-mono">"{searchQuery}"</span>}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleResetFilters}
                          className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Clear Filters & View All
                        </button>
                        <button
                          onClick={handleSeedSample}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg border border-stone-300 transition-colors cursor-pointer"
                        >
                          Seed Demo Records
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {app.applicationId}
                      {app.duplicateFlag && (
                        <span
                          title={app.duplicateReason}
                          className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                        >
                          DUPLICATE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-900">{app.fullName}</td>
                    <td className="py-3 px-4 font-mono text-stone-600">XXXX-XXXX-{app.aadhaarLast4}</td>
                    <td className="py-3 px-4">
                      {app.calculatedAge} yrs · {app.gender}
                    </td>
                    <td className="py-3 px-4">
                      {app.assemblyConstituency}, {app.state}
                    </td>
                    <td className="py-3 px-4">
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
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setAdminRemarks(app.adminRemarks || '');
                          setMessage('');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded border border-stone-200 transition-colors cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-stone-400 font-medium">Electoral Review</span>
                <h2 className="text-xl font-bold font-mono text-stone-900 mt-0.5">
                  {selectedApp.applicationId}
                </h2>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-stone-400 hover:text-stone-700 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {message && (
              <div className="p-3 mb-6 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800">
                {message}
              </div>
            )}

            {/* Duplicate Notice */}
            {selectedApp.duplicateFlag && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl mb-6 text-xs text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-amber-950">Duplicate Match Alert:</strong>
                  <p className="mt-1">{selectedApp.duplicateReason}</p>
                </div>
              </div>
            )}

            {/* Applicant Details */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <span className="text-stone-400 block">Applicant Name</span>
                <span className="font-bold text-stone-900 text-sm">{selectedApp.fullName}</span>
              </div>
              <div>
                <span className="text-stone-400 block">Relative ({selectedApp.relationType})</span>
                <span className="font-semibold text-stone-800">{selectedApp.relativeName}</span>
              </div>
              <div>
                <span className="text-stone-400 block">Date of Birth & Age</span>
                <span className="font-medium text-stone-800">
                  {new Date(selectedApp.dob).toLocaleDateString()} ({selectedApp.calculatedAge} years old)
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">Gender & Mobile</span>
                <span className="font-medium text-stone-800">
                  {selectedApp.gender} · {selectedApp.mobile}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-stone-400 block">Address</span>
                <span className="font-medium text-stone-800">
                  {selectedApp.houseNo}, {selectedApp.street}, {selectedApp.villageOrTown}, {selectedApp.postOffice} - {selectedApp.pincode}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block">Constituency</span>
                <span className="font-semibold text-stone-900">{selectedApp.assemblyConstituency}</span>
              </div>
              <div>
                <span className="text-stone-400 block">State</span>
                <span className="font-semibold text-stone-900">{selectedApp.state}</span>
              </div>
              {selectedApp.epicNumber && (
                <div className="col-span-2 p-2 bg-emerald-100/70 border border-emerald-300 rounded text-emerald-950 font-mono font-bold text-center">
                  Simulated EPIC: {selectedApp.epicNumber}
                </div>
              )}
            </div>

            {/* Decision Form */}
            <div className="space-y-4 pt-4 border-t border-stone-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Decision & Remarks
              </h3>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Officer Remarks / Field Verification Notes
                </label>
                <input
                  type="text"
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g. Identity verified via Aadhaar suffix, address checked by BLO."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:outline-none focus:border-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Rejection Reason (if rejecting)
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white focus:outline-none"
                >
                  <option value="Supporting document mismatch">Supporting document mismatch</option>
                  <option value="Blurry / Unclear photograph">Blurry / Unclear photograph</option>
                  <option value="Under-age on qualifying date (must be 18+)">Under-age on qualifying date (must be 18+)</option>
                  <option value="Duplicate voter registration detected">Duplicate voter registration detected</option>
                  <option value="Invalid address proof in constituency">Invalid address proof in constituency</option>
                </select>
              </div>

              {/* Status Action Buttons */}
              <div className="grid grid-cols-3 gap-3 pt-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusUpdate('Under Review')}
                  className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Set Under Review</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusUpdate('Approved')}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Issue EPIC</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusUpdate('Rejected')}
                  className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
