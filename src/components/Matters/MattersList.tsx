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
import { DocketStamp } from '../common/DocketStamp';
import { useAuth } from '../../context/AuthContext';

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
  const { currentUser } = useAuth();
  const canIntake = currentUser?.role === 'admin' || currentUser?.role === 'lawyer' || currentUser?.role === 'paralegal';

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
      <div className="legal-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-2">
            <Gavel className="w-6 h-6 text-[#B8935F]" />
            Court Cause List & Cause Registry
          </h1>
          <p className="text-[13px] text-[#626A84] dark:text-[#8A90AC] mt-1">
            Central registry of suit numbers, presiding judges, court sitting dates, land plot numbers, and party appearances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMattersToCsv(filteredMatters, 'filtered_cause_list')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[rgba(184,147,95,0.25)] bg-[#EDE8DC] dark:bg-[#1B2140] hover:bg-[#E3DDD0] dark:hover:bg-[#232A50] text-[#12172B] dark:text-[#F6F3EC] text-[13px] font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#4F8F6B]" />
            Export Filtered CSV
          </button>

          {canIntake && (
            <button
              onClick={openNewMatterModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] text-[13px] font-bold shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Intake Matter
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="legal-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8A90AC]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suit no, judge, plot, party..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] text-[13px] border border-[rgba(184,147,95,0.2)] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-[13px]">
          
          <div className="flex items-center gap-1.5 text-[#8A90AC] font-semibold">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </div>

          <div className="flex items-center gap-1 bg-[#F6F3EC] dark:bg-[#12172B] p-1 rounded-lg border border-[rgba(184,147,95,0.15)]">
            {['all', 'active', 'adjourned', 'won', 'lost', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-md uppercase font-mono text-[13px] font-semibold transition ${
                  selectedStatus === st
                    ? 'bg-[#B8935F] text-[#12172B] shadow-xs'
                    : 'text-[#626A84] dark:text-[#8A90AC] hover:text-[#12172B] dark:hover:text-[#F6F3EC]'
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
              className="p-2 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)] font-medium text-[#12172B] dark:text-[#F6F3EC] text-[13px]"
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
      <div className="legal-card p-6">
        <div className="overflow-x-auto border border-[rgba(184,147,95,0.2)] rounded-lg">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-[#EDE8DC]/60 dark:bg-[#1B2140]/80 text-[#12172B] dark:text-[#F6F3EC] font-semibold uppercase tracking-wider border-b border-[rgba(184,147,95,0.2)]">
                <th className="p-3 font-mono">Suit No.</th>
                <th className="p-3">Cause Title</th>
                <th className="p-3">Presiding Judge</th>
                <th className="p-3">Next Hearing</th>
                <th className="p-3">Purpose</th>
                <th className="p-3 font-mono">Plot / Subject</th>
                <th className="p-3">Defendant / Respondent</th>
                <th className="p-3">Lead Counsel</th>
                <th className="p-3">Docket Stamp</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(184,147,95,0.15)] text-[#12172B] dark:text-[#F6F3EC]">
              {filteredMatters.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#B8935F]/10 text-[#B8935F] flex items-center justify-center mx-auto">
                        <Gavel className="w-6 h-6" />
                      </div>
                      <div className="font-serif text-lg font-semibold text-[#12172B] dark:text-[#F6F3EC]">
                        {matters.length === 0 ? 'Cause Registry is Empty' : 'No Matching Proceedings Found'}
                      </div>
                      <p className="text-[13px] text-[#5C6278] dark:text-[#8A90AC]">
                        {matters.length === 0
                          ? 'Your practice registry is connected to Cloud Firestore and currently empty. Click below to intake your first matter.'
                          : 'Try adjusting your search query or status filter above.'}
                      </p>
                      {matters.length === 0 && canIntake && (
                        <button
                          onClick={openNewMatterModal}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] font-bold text-[13px] shadow-sm transition mt-2"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Intake First Real Matter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMatters.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => onSelectMatter(m)}
                    className="hover:bg-[#B8935F]/10 cursor-pointer transition group"
                  >
                    <td className="p-3 font-mono font-semibold text-[#B8935F] whitespace-nowrap">
                      {m.suitNumber}
                    </td>
                    <td className="p-3 font-serif font-semibold text-[#12172B] dark:text-[#F6F3EC] max-w-xs truncate">
                      {m.title}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap">
                      {m.judge || 'Unassigned'}
                    </td>
                    <td className="p-3 font-mono font-semibold whitespace-nowrap text-[#12172B] dark:text-[#F6F3EC]">
                      {m.nextHearingDate || 'Unscheduled'}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#B8935F]/10 border border-[#B8935F]/20 text-[13px]">
                        {m.purpose || 'Hearing'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[13px] text-[#8A90AC] max-w-xs truncate">
                      {m.plot || '-'}
                    </td>
                    <td className="p-3 max-w-xs truncate font-medium">
                      {m.defendants.join(', ') || 'N/A'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {m.leadLawyerName || 'Counsel'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <DocketStamp status={m.status} size="sm" />
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMatter(m);
                        }}
                        className="p-1.5 rounded-lg bg-[#B8935F]/10 text-[#B8935F] hover:bg-[#B8935F] hover:text-[#12172B] transition"
                        title="View Full Brief"
                      >
                        <Eye className="w-3 h-3" />
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
