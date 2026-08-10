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
  CartesianGrid,
} from 'recharts';
import { Matter } from '../types';
import { exportMattersToCsv } from '../utils/csvExport';
import { DocketStamp } from './common/DocketStamp';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

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

  // Chart Data Preparation with Exact Color Tokens
  const pieData = [
    { name: 'Active', value: statusCounts.active, color: '#B8935F' },
    { name: 'Adjourned', value: statusCounts.adjourned, color: '#C99A3D' },
    { name: 'Won', value: statusCounts.won, color: '#4F8F6B' },
    { name: 'Lost', value: statusCounts.lost, color: '#C1554A' },
    { name: 'Closed', value: statusCounts.closed, color: '#8A90AC' },
  ].filter((item) => item.value > 0);

  // Group by Judge or Court
  const judgeCounts: Record<string, number> = {};
  matters.forEach((m) => {
    let judgeName = m.judge || 'Unassigned Judge';
    // Shorten surname for clean bar chart labels
    if (judgeName.includes('Hon. Justice')) {
      judgeName = judgeName.replace('Hon. Justice', 'Justice').trim();
    }
    judgeCounts[judgeName] = (judgeCounts[judgeName] || 0) + 1;
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
      
      {/* Functional Header Bar - Single line status & action buttons */}
      <div className="legal-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#5C6278] dark:text-[#8A90AC]">
          <span className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">
            {currentUser?.organization || 'Mainland Chambers'}
          </span>
          <span>&bull;</span>
          <span>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span>&bull;</span>
          <span className="font-medium text-[#B8935F]">
            {upcoming7Days.length} suits scheduled for hearing this week
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openNewMatterModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] text-[13px] font-semibold transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Intake Matter
          </button>
          
          <button
            onClick={() => exportMattersToCsv(matters, 'full_cause_list')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(184,147,95,0.25)] bg-[#FFFFFF] dark:bg-[#1B2140] hover:bg-[#F0EBE0] dark:hover:bg-[#232A50] text-[#12172B] dark:text-[#F6F3EC] text-[13px] font-medium transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E7D52]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards Row - 4 across desktop, 2 tablet, 1 mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1 */}
        <div className="legal-card legal-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="icon-box-32">
              <Gavel className="w-4 h-4" />
            </div>
            <span className="font-mono text-[11px] text-[#5C6278] dark:text-[#8A90AC]">SUITS</span>
          </div>
          <div className="mt-2">
            <div className="text-[20px] font-mono font-semibold text-[#12172B] dark:text-[#F6F3EC]">
              {totalMatters}
            </div>
            <div className="text-[12px] font-normal text-[#5C6278] dark:text-[#8A90AC] mt-0.5">
              Total Suit Registry ({statusCounts.active} active)
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="legal-card legal-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="icon-box-32" style={{ color: '#B4781A', backgroundColor: 'rgba(180, 120, 26, 0.12)' }}>
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-mono text-[11px] text-[#B4781A]">7 DAYS</span>
          </div>
          <div className="mt-2">
            <div className="text-[20px] font-mono font-semibold text-[#B4781A]">
              {upcoming7Days.length}
            </div>
            <div className="text-[12px] font-normal text-[#5C6278] dark:text-[#8A90AC] mt-0.5">
              Immediate Court Hearings
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="legal-card legal-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="icon-box-32" style={{ color: '#2E7D52', backgroundColor: 'rgba(46, 125, 82, 0.12)' }}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="font-mono text-[11px] text-[#2E7D52]">30 DAYS</span>
          </div>
          <div className="mt-2">
            <div className="text-[20px] font-mono font-semibold text-[#12172B] dark:text-[#F6F3EC]">
              {upcoming30Days.length}
            </div>
            <div className="text-[12px] font-normal text-[#5C6278] dark:text-[#8A90AC] mt-0.5">
              Scheduled Cause List Dates
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="legal-card legal-card-hover p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="icon-box-32" style={{ color: '#2E7D52', backgroundColor: 'rgba(46, 125, 82, 0.12)' }}>
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="font-mono text-[11px] text-[#2E7D52]">OUTCOMES</span>
          </div>
          <div className="mt-2">
            <div className="text-[20px] font-mono font-semibold text-[#2E7D52]">
              {statusCounts.won} Won
            </div>
            <div className="text-[12px] font-normal text-[#5C6278] dark:text-[#8A90AC] mt-0.5">
              {statusCounts.closed} closed &bull; {statusCounts.lost} lost
            </div>
          </div>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Breakdown Donut Chart with Legend */}
        <div className="legal-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-[16px] font-semibold text-[#12172B] dark:text-[#F6F3EC]">
              Litigation Status Distribution
            </h3>
            <span className="font-mono text-[11px] text-[#5C6278] dark:text-[#8A90AC]">REGISTRY</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-48 w-48 shrink-0 relative">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1B2140' : '#FFFFFF',
                        borderColor: 'rgba(184, 147, 95, 0.3)',
                        borderRadius: '8px',
                        color: isDark ? '#F6F3EC' : '#12172B',
                        fontSize: '12px',
                        fontFamily: 'IBM Plex Mono, monospace',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[12px] text-[#5C6278] dark:text-[#8A90AC]">
                  No active registry data
                </div>
              )}
            </div>

            {/* Custom Explicit Legend (Status name + count + color swatch) */}
            <div className="flex-1 space-y-2 w-full">
              {[
                { label: 'Active Suits', count: statusCounts.active, color: '#B8935F' },
                { label: 'Adjourned / Pending', count: statusCounts.adjourned, color: '#B4781A' },
                { label: 'Won / Judgments', count: statusCounts.won, color: '#2E7D52' },
                { label: 'Lost / Dismissed', count: statusCounts.lost, color: '#C13B30' },
                { label: 'Closed Files', count: statusCounts.closed, color: '#5C6278' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-[#12172B] dark:text-[#F6F3EC]">{item.label}</span>
                  </div>
                  <span className="font-mono font-semibold text-[#12172B] dark:text-[#F6F3EC]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Matters by Presiding Judge Bar Chart */}
        <div className="legal-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-[16px] font-semibold text-[#12172B] dark:text-[#F6F3EC]">
              Suits by Presiding Judge
            </h3>
            <span className="font-mono text-[11px] text-[#5C6278] dark:text-[#8A90AC]">BENCH DIVISION</span>
          </div>

          <div className="h-48 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(184, 147, 95, 0.15)" vertical={false} />
                  <XAxis
                    dataKey="judge"
                    stroke={isDark ? '#8A90AC' : '#5C6278'}
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke={isDark ? '#8A90AC' : '#5C6278'} fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1B2140' : '#FFFFFF',
                      borderColor: 'rgba(184, 147, 95, 0.3)',
                      borderRadius: '8px',
                      color: isDark ? '#F6F3EC' : '#12172B',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono, monospace',
                    }}
                  />
                  <Bar dataKey="count" fill="#B8935F" radius={[4, 4, 0, 0]} name="Total Matters" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[12px] text-[#5C6278] dark:text-[#8A90AC]">
                No hearings scheduled this week
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Cause List Snapshot Table */}
      <div className="legal-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="font-serif text-[18px] font-semibold text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-2">
              <Gavel className="w-4 h-4 text-[#B8935F]" />
              Court Cause List & Upcoming Appearances
            </h3>
          </div>

          <button
            onClick={() => setActiveTab('matters')}
            className="text-[12px] font-semibold text-[#B8935F] hover:underline flex items-center gap-1"
          >
            View Full Registry ({matters.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto border border-[rgba(184,147,95,0.2)] rounded-lg">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead>
              <tr className="bg-[#F5F2EA] dark:bg-[#12172B]/70 text-[#12172B] dark:text-[#F6F3EC] font-semibold uppercase tracking-wider border-b border-[rgba(184,147,95,0.2)]">
                <th className="p-2.5 font-mono">Suit No.</th>
                <th className="p-2.5">Presiding Judge</th>
                <th className="p-2.5">Next Hearing</th>
                <th className="p-2.5">Purpose</th>
                <th className="p-2.5">Lead Counsel</th>
                <th className="p-2.5">Defendant / Respondent</th>
                <th className="p-2.5">Plot / Subject</th>
                <th className="p-2.5">Docket Stamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(184,147,95,0.15)] text-[#12172B] dark:text-[#F6F3EC]">
              {causeListUpcoming.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#5C6278] dark:text-[#8A90AC]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div>No active cause list entries in your practice database.</div>
                      <button
                        onClick={openNewMatterModal}
                        className="px-3.5 py-1.5 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] font-bold text-[12px] transition mt-1"
                      >
                        + Intake New Matter
                      </button>
                    </div>
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
                    className="hover:bg-[#B8935F]/10 cursor-pointer transition"
                  >
                    <td className="p-2.5 font-mono font-semibold text-[#B8935F] whitespace-nowrap">
                      {m.suitNumber}
                    </td>
                    <td className="p-2.5 font-medium whitespace-nowrap">
                      {m.judge || 'Unassigned'}
                    </td>
                    <td className="p-2.5 font-semibold whitespace-nowrap font-mono text-[#12172B] dark:text-[#F6F3EC]">
                      {m.nextHearingDate || 'Unscheduled'}
                    </td>
                    <td className="p-2.5 font-medium whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#B8935F]/10 border border-[#B8935F]/20 text-[11px]">
                        {m.purpose || 'Hearing'}
                      </span>
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      {m.leadLawyerName || 'Counsel'}
                    </td>
                    <td className="p-2.5 font-medium max-w-xs truncate">
                      {m.defendants.join(', ') || 'N/A'}
                    </td>
                    <td className="p-2.5 max-w-xs truncate font-mono text-[11px] text-[#5C6278] dark:text-[#8A90AC]">
                      {m.plot || '-'}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <DocketStamp status={m.status} size="sm" />
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
          className="legal-card legal-card-hover p-4 text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="icon-box-32" style={{ color: '#C1554A', backgroundColor: 'rgba(193, 85, 74, 0.12)' }}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-[13px] text-[#12172B] dark:text-[#F6F3EC]">Conflict Checker</div>
              <div className="text-[13px] text-[#8A90AC]">Scan parties & plots before intake</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8A90AC]" />
        </button>

        <button
          onClick={openDeadlineCalcModal}
          className="legal-card legal-card-hover p-4 text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="icon-box-32">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-[13px] text-[#12172B] dark:text-[#F6F3EC]">Statutory Calculator</div>
              <div className="text-[13px] text-[#8A90AC]">Calculate pleading & PTC windows</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8A90AC]" />
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className="legal-card legal-card-hover p-4 text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="icon-box-32" style={{ color: '#C99A3D', backgroundColor: 'rgba(201, 154, 61, 0.12)' }}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-[13px] text-[#12172B] dark:text-[#F6F3EC]">Hearing Reminders</div>
              <div className="text-[13px] text-[#8A90AC]">Set email & in-app alerts</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8A90AC]" />
        </button>

      </div>

    </div>
  );
};
