import React from 'react';
import {
  Gavel,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PlusCircle,
  ShieldAlert,
  Calculator,
  ChevronRight,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Matter } from '../types';
import { exportMattersToCsv } from '../utils/csvExport';

interface DashboardProps {
  matters: Matter[];
  setActiveTab: (tab: string) => void;
  onSelectMatter: (m: Matter) => void;
  openNewMatterModal: () => void;
  openDeadlineCalcModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  matters,
  setActiveTab,
  onSelectMatter,
  openNewMatterModal,
  openDeadlineCalcModal,
}) => {
  // Metrics Calculations
  const totalMatters = matters.length;

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86400000);
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const upcoming7Days = matters.filter((m) => {
    if (!m.nextHearingDate) return false;
    const d = new Date(m.nextHearingDate);
    return d >= now && d <= in7Days;
  });

  const upcoming30Days = matters.filter((m) => {
    if (!m.nextHearingDate) return false;
    const d = new Date(m.nextHearingDate);
    return d >= now && d <= in30Days;
  });

  const statusCounts = {
    active: matters.filter((m) => m.status === 'active').length,
    adjourned: matters.filter((m) => m.status === 'adjourned').length,
    won: matters.filter((m) => m.status === 'won').length,
    lost: matters.filter((m) => m.status === 'lost').length,
    closed: matters.filter((m) => m.status === 'closed').length,
  };

  // Chart Data Preparation
  const pieData = [
    { name: 'Active', value: statusCounts.active, color: '#2563eb' },
    { name: 'Adjourned', value: statusCounts.adjourned, color: '#d97706' },
    { name: 'Won', value: statusCounts.won, color: '#16a34a' },
    { name: 'Lost', value: statusCounts.lost, color: '#dc2626' },
    { name: 'Closed', value: statusCounts.closed, color: '#64748b' },
  ].filter((item) => item.value > 0);

  // Group by Judge or Court
  const judgeCounts: Record<string, number> = {};
  matters.forEach((m) => {
    const key = m.judge || 'Unassigned Judge';
    judgeCounts[key] = (judgeCounts[key] || 0) + 1;
  });

  const barData = Object.entries(judgeCounts).map(([judge, count]) => ({
    judge,
    count,
  }));

  // Sort upcoming hearings for quick cause list snippet
  const causeListUpcoming = [...matters]
    .filter((m) => m.nextHearingDate)
    .sort((a, b) => new Date(a.nextHearingDate!).getTime() - new Date(b.nextHearingDate!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold mb-2">
            <Gavel className="w-3.5 h-3.5" /> High Court Litigation Suite
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            Litigation Overview & Cause List Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time tracking of active suits, presiding judge sittings, statutory deadlines, and court appearances.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={openNewMatterModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            Intake Matter
          </button>
          
          <button
            onClick={() => exportMattersToCsv(matters, 'full_cause_list')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-700/80 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Suit Registry
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {totalMatters}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {statusCounts.active} active &bull; {statusCounts.adjourned} adjourned
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Gavel className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hearings (7 Days)
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {upcoming7Days.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Immediate court appearances
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hearings (30 Days)
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {upcoming30Days.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Scheduled cause list dates
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Case Outcomes
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {statusCounts.won} Won
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {statusCounts.closed} closed &bull; {statusCounts.lost} lost
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Charts & Cause List Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Breakdown Pie Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Litigation Status Distribution
            </h3>
            <span className="text-xs text-slate-400">All Registry Matters</span>
          </div>

          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No active registry data to plot
              </div>
            )}
          </div>
        </div>

        {/* Matters by Presiding Judge Bar Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Active Suits by Presiding Judge
            </h3>
            <span className="text-xs text-slate-400">Bench Division</span>
          </div>

          <div className="h-64 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="judge"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#d97706" radius={[6, 6, 0, 0]} name="Total Matters" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No judge assignments recorded
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Cause List Snapshot Table (Matches provided Cause List Format!) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Gavel className="w-4 h-4 text-amber-600" />
              Court Cause List & Upcoming Appearances
            </h3>
            <p className="text-xs text-slate-500">
              Chronological schedule of upcoming hearings, presiding judges, and purpose.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('matters')}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            View Full Registry ({matters.length}) <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Suit No.</th>
                <th className="p-3">Presiding Judge</th>
                <th className="p-3">Next Hearing</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Lead Lawyer</th>
                <th className="p-3">Defendant / Respondent</th>
                <th className="p-3">Plot / Subject</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-sans">
              {causeListUpcoming.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    No upcoming court cause list entries found.
                  </td>
                </tr>
              ) : (
                causeListUpcoming.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => {
                      onSelectMatter(m);
                      setActiveTab('matters');
                    }}
                    className="hover:bg-amber-500/5 cursor-pointer transition"
                  >
                    <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {m.suitNumber}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap">
                      {m.judge || 'Unassigned'}
                    </td>
                    <td className="p-3 font-semibold whitespace-nowrap text-slate-900 dark:text-slate-100">
                      {m.nextHearingDate || 'Unscheduled'}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                        {m.purpose || 'Hearing'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {m.leadLawyerName || 'Chisom'}
                    </td>
                    <td className="p-3 font-medium max-w-xs truncate">
                      {m.defendants.join(', ') || 'N/A'}
                    </td>
                    <td className="p-3 max-w-xs truncate font-mono text-[11px] text-slate-500">
                      {m.plot || '-'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          m.status === 'active'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : m.status === 'adjourned'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : m.status === 'won'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Tools Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <button
          onClick={() => setActiveTab('conflict')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 text-left transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Conflict Checker</div>
              <div className="text-[11px] text-slate-500">Scan parties & plots before intake</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={openDeadlineCalcModal}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 text-left transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Statutory Calculator</div>
              <div className="text-[11px] text-slate-500">Calculate pleading & PTC windows</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 text-left transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Hearing Reminders</div>
              <div className="text-[11px] text-slate-500">Set email & in-app alerts</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

      </div>

    </div>
  );
};
