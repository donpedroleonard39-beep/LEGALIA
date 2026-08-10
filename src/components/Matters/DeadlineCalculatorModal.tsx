import React, { useState } from 'react';
import { X, Calculator, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import { calculateStatutoryDeadlines } from '../../utils/deadlineCalculator';

interface DeadlineCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeadlineCalculatorModal: React.FC<DeadlineCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [courtType, setCourtType] = useState('High Court Civil Procedure Rules');
  const [filingDate, setFilingDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const result = calculateStatutoryDeadlines(courtType, filingDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-800 dark:text-slate-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
                Statutory Deadline Calculator
              </h2>
              <p className="text-xs text-slate-500">
                Automated procedural timeline computation under civil court rules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Court Jurisdiction Rules</label>
              <select
                value={courtType}
                onChange={(e) => setCourtType(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="High Court Civil Procedure Rules">High Court Civil Rules</option>
                <option value="Federal High Court (Civil Procedure)">Federal High Court Rules</option>
                <option value="Court of Appeal Rules">Court of Appeal Rules</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Filing / Service Commencement Date</label>
              <input
                type="date"
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
          </div>

          {/* Result Cards */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="font-bold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wider">
              Computed Statutory Deadline Schedule ({result.courtType})
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-500/20">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Statement of Claim / Appearance</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{result.statementOfClaimDue}</div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-500/20">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Statement of Defense Limit</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{result.defenseDue}</div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-500/20">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Claimant Reply Window</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{result.replyDue}</div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-500/20">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Pre-Trial Conference Max</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{result.preTrialConferenceMaxDate}</div>
              </div>
            </div>

            <div className="pt-2 space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
              {result.statutoryNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
