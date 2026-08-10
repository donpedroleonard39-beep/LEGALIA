import React, { useState } from 'react';
import {
  Gavel,
  Search,
  Filter,
  FileSpreadsheet,
  PlusCircle,
  Eye,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Matter, MatterStatus } from '../../types';
import { exportMattersToCsv } from '../../utils/csvExport';

interface MattersListProps {
  matters: Matter[];
  onSelectMatter: (matter: Matter) => void;
  openNewMatterModal: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const MattersList: React.FC<MattersListProps> = ({
  matters,
  onSelectMatter,
  openNewMatterModal,
  searchQuery,
  setSearchQuery,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedJudge, setSelectedJudge] = useState<string>('all');

  // Extract unique judges
  const judgesList = Array.from(
    new Set(matters.map((m) => m.judge).filter(Boolean))
  ) as string[];

  // Filter matters
  const filteredMatters = matters.filter((m) => {
    // Search query check
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      m.suitNumber.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      (m.judge && m.judge.toLowerCase().includes(q)) ||
      (m.plot && m.plot.toLowerCase().includes(q)) ||
      m.defendants.some((d) => d.toLowerCase().includes(q)) ||
      m.plaintiffs.some((p) => p.toLowerCase().includes(q)) ||
      (m.leadLawyerName && m.leadLawyerName.toLowerCase().includes(q));

    // Status filter
    const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;

    // Judge filter
    const matchesJudge = selectedJudge === 'all' || m.judge === selectedJudge;

    return matchesQuery && matchesStatus && matchesJudge;
  });

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Gavel className="w-6 h-6 text-amber-600" />
            Court Cause List & Cause Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central registry of suit numbers, presiding judges, court sitting dates, land plot numbers, and party appearances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMattersToCsv(filteredMatters, 'filtered_cause_list')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Filtered CSV
          </button>

          <button
            onClick={openNewMatterModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" />
            Intake Matter
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suit no, judge, plot, party..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          
          <div className="flex items-center gap-1.5 text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {['all', 'active', 'adjourned', 'won', 'lost', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold transition ${
                  selectedStatus === st
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Judge Filter */}
          {judgesList.length > 0 && (
            <select
              value={selectedJudge}
              onChange={(e) => setSelectedJudge(e.target.value)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Presiding Judges</option>
              {judgesList.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          )}

        </div>

      </div>

      {/* Main Cause List Data Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Suit No.</th>
                <th className="p-3">Cause Title</th>
                <th className="p-3">P. Judge</th>
                <th className="p-3">Next Hearing</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Plot / Subject</th>
                <th className="p-3">Defendant / Respondent</th>
                <th className="p-3">Lawyer</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-sans">
              {filteredMatters.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No matching legal proceedings found in registry.
                  </td>
                </tr>
              ) : (
                filteredMatters.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => onSelectMatter(m)}
                    className="hover:bg-amber-500/5 cursor-pointer transition group"
                  >
                    <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {m.suitNumber}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {m.title}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap">
                      {m.judge || 'Ajah'}
                    </td>
                    <td className="p-3 font-semibold whitespace-nowrap text-slate-900 dark:text-slate-100">
                      {m.nextHearingDate || 'Unscheduled'}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                        {m.purpose || 'Hearing'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {m.plot || '-'}
                    </td>
                    <td className="p-3 max-w-xs truncate font-medium">
                      {m.defendants.join(', ') || 'N/A'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {m.leadLawyerName || 'Chisom'}
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
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMatter(m);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white transition"
                        title="View Full Brief"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
