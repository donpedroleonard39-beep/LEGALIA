import React, { useState } from 'react';
import { ShieldAlert, Search, AlertCircle, CheckCircle2, ChevronRight, Gavel } from 'lucide-react';
import { Matter } from '../../types';
import { searchConflictOfInterest } from '../../services/matterService';

interface ConflictCheckerProps {
  matters: Matter[];
  onSelectMatter: (m: Matter) => void;
  setActiveTab: (tab: string) => void;
}

export const ConflictChecker: React.FC<ConflictCheckerProps> = ({
  matters,
  onSelectMatter,
  setActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const results = searchConflictOfInterest(searchTerm, matters);

  const totalConflicts =
    results.directPartyMatches.length +
    results.plotMatches.length +
    results.counselMatches.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      setHasSearched(true);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100">
              Conflict-of-Interest Search Engine
            </h1>
            <p className="text-xs text-slate-500">
              Mandatory pre-intake screening across existing plaintiffs, defendants, subject plot land, and opposing counsel.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mt-4 flex gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              required
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter party name, company, defendant, or plot number (e.g. Aforka, Anyanwu, S/10 Plot 33)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-md"
          >
            Run Conflict Check
          </button>
        </form>
      </div>

      {/* Results View */}
      {hasSearched && (
        <div className="space-y-6">
          
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
              totalConflicts > 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {totalConflicts > 0 ? (
                <>
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>POTENTIAL CONFLICT DETECTED: Found {totalConflicts} matching record(s) for "{searchTerm}".</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>NO CONFLICT DETECTED: No existing suits found matching "{searchTerm}". Clearance approved for intake.</span>
                </>
              )}
            </div>
          </div>

          {/* Direct Party Matches */}
          {results.directPartyMatches.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="font-bold text-xs uppercase text-rose-600 tracking-wider">
                Direct Party Matches ({results.directPartyMatches.length})
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {results.directPartyMatches.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMatter(m);
                      setActiveTab('matters');
                    }}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer px-2 rounded-xl transition"
                  >
                    <div>
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400">{m.suitNumber} &bull; {m.title}</div>
                      <div className="text-slate-500 text-[11px]">Judge: {m.judge} &bull; Plaintiffs: {m.plaintiffs.join(', ')} &bull; Defendants: {m.defendants.join(', ')}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plot Property Matches */}
          {results.plotMatches.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="font-bold text-xs uppercase text-amber-600 tracking-wider">
                Subject Property / Plot Matches ({results.plotMatches.length})
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {results.plotMatches.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMatter(m);
                      setActiveTab('matters');
                    }}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer px-2 rounded-xl transition"
                  >
                    <div>
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400">{m.suitNumber} &bull; Plot: {m.plot}</div>
                      <div className="text-slate-500 text-[11px]">{m.title}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
