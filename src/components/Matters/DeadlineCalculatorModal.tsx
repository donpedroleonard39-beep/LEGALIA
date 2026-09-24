import React, { useState } from 'react';
import { X, Calculator, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDate, todayISO } from '../../utils/dates';
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
  const [filingDate, setFilingDate] = useState(todayISO());

  if (!isOpen) return null;

  const result = calculateStatutoryDeadlines(courtType, filingDate);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="deadline-calc-title">
      <div className="modal-shell max-w-xl">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="modal-icon"><Calculator className="h-5 w-5" /></span>
            <div>
              <h2 id="deadline-calc-title" className="font-serif-title text-[18px] font-semibold">
                Deadline calculator
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="modal-body">
          <div className="mb-5 flex gap-2.5 rounded-lg border border-[rgba(183,120,36,.35)] bg-[rgba(183,120,36,.08)] p-3 text-[13px] leading-5 text-[var(--text-main)]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--caution-amber)]" />
            <span><strong>Estimate only.</strong> Time limits differ between states and change when rules are amended. Always check the current rules of the court handling your case, or ask your lawyer.</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <label className="block text-[12px] font-medium text-[var(--text-muted)]">
              Court
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

            <label className="block text-[12px] font-medium text-[var(--text-muted)]">
              {result.startLabel}
              <input
                type="date"
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
                className="field-control mt-1.5 w-full font-semibold"
              />
            </label>
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--gold-soft)', border: '1px solid rgba(208,173,114,.32)' }}>
            <div className="text-[13px] font-semibold text-[var(--text-main)]">Estimated dates</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="panel-card !p-3">
                <div className="text-[12px] text-[var(--text-muted)]">{result.labels[0]}</div>
                <div className="mt-0.5 text-[15px] font-semibold text-[var(--text-main)]">{formatDate(result.statementOfClaimDue)}</div>
              </div>
              <div className="panel-card !p-3">
                <div className="text-[12px] text-[var(--text-muted)]">{result.labels[1]}</div>
                <div className="mt-0.5 text-[15px] font-semibold text-[var(--text-main)]">{formatDate(result.defenseDue)}</div>
              </div>
              <div className="panel-card !p-3">
                <div className="text-[12px] text-[var(--text-muted)]">{result.labels[2]}</div>
                <div className="mt-0.5 text-[15px] font-semibold text-[var(--text-main)]">{formatDate(result.replyDue)}</div>
              </div>
              <div className="panel-card !p-3">
                <div className="text-[12px] text-[var(--text-muted)]">{result.labels[3]}</div>
                <div className="mt-0.5 text-[15px] font-semibold text-[var(--text-main)]">{formatDate(result.preTrialConferenceMaxDate)}</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {result.statutoryNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[12px] leading-4 text-[var(--text-main)]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="button-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
