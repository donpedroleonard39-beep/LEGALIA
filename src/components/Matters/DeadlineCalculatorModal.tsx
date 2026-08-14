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
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="deadline-calc-title">
      <div className="modal-shell max-w-xl">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="modal-icon"><Calculator className="h-5 w-5" /></span>
            <div>
              <p className="eyebrow">Statutory diary</p>
              <h2 id="deadline-calc-title" className="font-serif-title text-[18px] font-semibold">
                Deadline calculator
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="icon-button"><X className="h-5 w-5" /></button>
        </div>

        <div className="modal-body">
          <p className="mb-5 text-[12px] leading-5 text-[var(--text-muted)]">
            Automated procedural timeline computation under civil court rules. This is a planning aid, not legal advice — always confirm against the applicable rules of court.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <label className="block text-[11px] font-medium text-[var(--text-muted)]">
              Court jurisdiction rules
              <select
                value={courtType}
                onChange={(e) => setCourtType(e.target.value)}
                className="field-control mt-1.5 w-full font-semibold"
              >
                <option value="High Court Civil Procedure Rules">High Court Civil Rules</option>
                <option value="Federal High Court (Civil Procedure)">Federal High Court Rules</option>
                <option value="Court of Appeal Rules">Court of Appeal Rules</option>
              </select>
            </label>

            <label className="block text-[11px] font-medium text-[var(--text-muted)]">
              Filing / service commencement date
              <input
                type="date"
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
                className="field-control mt-1.5 w-full font-semibold"
              />
            </label>
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--gold-soft)', border: '1px solid rgba(208,173,114,.32)' }}>
            <div className="eyebrow">Computed schedule · {result.courtType}</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="panel-card !p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Statement of Claim / Appearance</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">{result.statementOfClaimDue}</div>
              </div>
              <div className="panel-card !p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Statement of Defense Limit</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">{result.defenseDue}</div>
              </div>
              <div className="panel-card !p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Claimant Reply Window</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">{result.replyDue}</div>
              </div>
              <div className="panel-card !p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Pre-Trial Conference Max</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">{result.preTrialConferenceMaxDate}</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {result.statutoryNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] leading-4 text-[var(--text-main)]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="button-primary">
              Close <ShieldCheck className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
