import React, { useState } from 'react';
import { X, Gavel, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Matter, MatterStatus } from '../../types';
import { saveMatter, updateMatterDetails, checkSuitNumberUnique } from '../../services/matterService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface MatterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  matterToEdit?: Matter | null;
  onSaved: () => void;
}

export const MatterFormModal: React.FC<MatterFormModalProps> = ({
  isOpen,
  onClose,
  matterToEdit,
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [suitNumber, setSuitNumber] = useState(matterToEdit?.suitNumber || '');
  const [title, setTitle] = useState(matterToEdit?.title || '');
  const [court, setCourt] = useState(matterToEdit?.court || 'High Court 3, Enugu Division');
  const [judge, setJudge] = useState(matterToEdit?.judge || 'Hon. Justice Ajah');
  const [plot, setPlot] = useState(matterToEdit?.plot || '');
  const [plaintiffsText, setPlaintiffsText] = useState(matterToEdit?.plaintiffs?.join(', ') || '');
  const [defendantsText, setDefendantsText] = useState(matterToEdit?.defendants?.join(', ') || '');
  const [leadLawyerName, setLeadLawyerName] = useState(matterToEdit?.leadLawyerName || currentUser?.name || 'Barr. Chisom Okeke');
  const [status, setStatus] = useState<MatterStatus>(matterToEdit?.status || 'active');
  const [filingDate, setFilingDate] = useState(matterToEdit?.filingDate || new Date().toISOString().split('T')[0]);
  const [nextHearingDate, setNextHearingDate] = useState(matterToEdit?.nextHearingDate || '');
  const [purpose, setPurpose] = useState(matterToEdit?.purpose || 'Hearing');
  const [appearances, setAppearances] = useState(matterToEdit?.appearances || '');
  const [summaryNotes, setSummaryNotes] = useState(matterToEdit?.summaryNotes || '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!suitNumber.trim()) {
      setErrorMessage('Suit Number is strictly required (e.g. E/968/2022).');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Matter Title / Cause is required.');
      return;
    }

    setSubmitting(true);

    try {
      // Validate suit number uniqueness
      const isUnique = await checkSuitNumberUnique(suitNumber, matterToEdit?.id);
      if (!isUnique) {
        setErrorMessage(`Suit Number "${suitNumber}" already exists in the system registry.`);
        setSubmitting(false);
        return;
      }

      const plaintiffs = plaintiffsText
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const defendants = defendantsText
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      if (matterToEdit) {
        await updateMatterDetails(
          matterToEdit.id,
          {
            suitNumber: suitNumber.trim(),
            title: title.trim(),
            court: court.trim(),
            judge: judge.trim(),
            plot: plot.trim(),
            plaintiffs,
            defendants,
            leadLawyerName: leadLawyerName.trim(),
            status,
            filingDate,
            nextHearingDate: nextHearingDate || undefined,
            purpose: purpose.trim(),
            appearances: appearances.trim(),
            summaryNotes: summaryNotes.trim(),
          },
          currentUser?.uid || 'user_demo',
          currentUser?.name || 'Counsel'
        );
        showToast('Matter Updated', `Suit No. ${suitNumber} updated successfully.`, 'success');
      } else {
        await saveMatter(
          {
            suitNumber: suitNumber.trim(),
            title: title.trim(),
            court: court.trim(),
            judge: judge.trim(),
            plot: plot.trim(),
            plaintiffs: plaintiffs.length > 0 ? plaintiffs : ['Claimant'],
            defendants: defendants.length > 0 ? defendants : ['Defendant'],
            leadLawyer: currentUser?.uid || 'lawyer_chisom',
            leadLawyerName: leadLawyerName.trim(),
            teamMembers: [currentUser?.uid || 'admin_demo', 'lawyer_chisom'],
            status,
            filingDate,
            nextHearingDate: nextHearingDate || undefined,
            purpose: purpose.trim(),
            appearances: appearances.trim(),
            summaryNotes: summaryNotes.trim(),
          },
          currentUser?.uid || 'user_demo',
          currentUser?.name || 'Counsel'
        );
        showToast('Matter Created', `Suit No. ${suitNumber} registered successfully.`, 'success');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving the suit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-800 dark:text-slate-200 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
                {matterToEdit ? `Edit Suit ${matterToEdit.suitNumber}` : 'Intake New Legal Proceeding'}
              </h2>
              <p className="text-xs text-slate-500">
                Enter court cause details, presiding judge, land plot, and parties.
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

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Suit Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={suitNumber}
                onChange={(e) => setSuitNumber(e.target.value)}
                placeholder="e.g. E/968/2022"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Presiding Judge (P. Judge)
              </label>
              <input
                type="text"
                value={judge}
                onChange={(e) => setJudge(e.target.value)}
                placeholder="e.g. Hon. Justice Ajah"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
              Suit Title / Cause <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chisom vs. Mr. Ibe Christian Aforka"
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Court & Division
              </label>
              <input
                type="text"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                placeholder="e.g. High Court 3, Enugu Division"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Plot / Subject Property
              </label>
              <input
                type="text"
                value={plot}
                onChange={(e) => setPlot(e.target.value)}
                placeholder="e.g. S/10 Plot 33"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Plaintiff(s) / Claimant(s) (comma separated)
              </label>
              <input
                type="text"
                value={plaintiffsText}
                onChange={(e) => setPlaintiffsText(e.target.value)}
                placeholder="e.g. Chisom Legal Chambers, Elder Paul Nnamani"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Defendant(s) / Respondent(s) (comma separated)
              </label>
              <input
                type="text"
                value={defendantsText}
                onChange={(e) => setDefendantsText(e.target.value)}
                placeholder="e.g. Mr. Ibe Christian Aforka, Theodore Anyanwu"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Lead Lawyer
              </label>
              <input
                type="text"
                value={leadLawyerName}
                onChange={(e) => setLeadLawyerName(e.target.value)}
                placeholder="e.g. Barr. Chisom Okeke"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatterStatus)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="active">ACTIVE</option>
                <option value="adjourned">ADJOURNED</option>
                <option value="won">WON</option>
                <option value="lost">LOST</option>
                <option value="closed">CLOSED</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Filing Date
              </label>
              <input
                type="date"
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Next Hearing Date
              </label>
              <input
                type="date"
                value={nextHearingDate}
                onChange={(e) => setNextHearingDate(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Hearing Purpose (e.g. P.T.C, Mention)
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. P.T.C, Hearing, Ruling, Further Mention"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
              Appearances Record
            </label>
            <input
              type="text"
              value={appearances}
              onChange={(e) => setAppearances(e.target.value)}
              placeholder="e.g. Chisom Esq. for Claimant, N.O. Egwu Esq. for Defendant"
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
              Summary Notes
            </label>
            <textarea
              rows={3}
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              placeholder="Case background, relief sought, key claims..."
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Registering...' : matterToEdit ? 'Save Changes' : 'Create Suit Record'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
