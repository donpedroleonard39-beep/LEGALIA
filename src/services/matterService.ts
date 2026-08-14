import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Check, FileText, Gavel, X } from 'lucide-react';
import { Matter, MatterStatus } from '../../types';
import { checkSuitNumberUnique, saveMatter, updateMatterDetails } from '../../services/matterService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface MatterFormModalProps { isOpen: boolean; onClose: () => void; matterToEdit?: Matter | null; onSaved: () => void; }

const emptyForm = { suitNumber: '', title: '', court: '', judge: '', plot: '', plaintiffs: '', defendants: '', leadLawyerName: '', status: 'active' as MatterStatus, filingDate: new Date().toISOString().slice(0, 10), nextHearingDate: '', purpose: 'Hearing', appearances: '', summaryNotes: '' };

type FormState = typeof emptyForm;
type Step = 'form' | 'review';

export function MatterFormModal({ isOpen, onClose, matterToEdit, onSaved }: MatterFormModalProps) {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setErrorMessage('');
    if (!matterToEdit) { setForm({ ...emptyForm, leadLawyerName: currentUser?.name || '' }); return; }
    setForm({ suitNumber: matterToEdit.suitNumber, title: matterToEdit.title, court: matterToEdit.court || '', judge: matterToEdit.judge || '', plot: matterToEdit.plot || '', plaintiffs: matterToEdit.plaintiffs.join(', '), defendants: matterToEdit.defendants.join(', '), leadLawyerName: matterToEdit.ownerName || '', status: matterToEdit.status, filingDate: matterToEdit.filingDate || emptyForm.filingDate, nextHearingDate: matterToEdit.nextHearingDate || '', purpose: matterToEdit.purpose || '', appearances: matterToEdit.appearances || '', summaryNotes: matterToEdit.summaryNotes || '' });
  }, [isOpen, matterToEdit, currentUser?.name]);

  if (!isOpen) return null;
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const splitPeople = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

  // Step 1: validate and check the suit number is actually available, then
  // hand off to the review screen. No write happens yet.
  const handleContinueToReview = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (!currentUser) { setErrorMessage('Please sign in before opening a matter.'); return; }
    if (!form.suitNumber.trim() || !form.title.trim()) { setErrorMessage('Suit number and matter title are required.'); return; }
    setSubmitting(true);
    try {
      const unique = await checkSuitNumberUnique(form.suitNumber, matterToEdit?.id);
      if (!unique) { setErrorMessage(`Suit number "${form.suitNumber}" is already in use.`); return; }
      setStep('review');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not verify the suit number right now.');
    } finally { setSubmitting(false); }
  };

  // Step 2: the user has reviewed the summary card and confirmed - only now
  // is the record actually written.
  const handleConfirmSave = async () => {
    if (!currentUser) { setErrorMessage('Please sign in before opening a matter.'); return; }
    setErrorMessage('');
    setSubmitting(true);
    try {
      const base = { suitNumber: form.suitNumber.trim(), title: form.title.trim(), court: form.court.trim(), judge: form.judge.trim(), plot: form.plot.trim(), plaintiffs: splitPeople(form.plaintiffs), defendants: splitPeople(form.defendants), status: form.status, filingDate: form.filingDate, nextHearingDate: form.nextHearingDate || undefined, purpose: form.purpose.trim(), appearances: form.appearances.trim(), summaryNotes: form.summaryNotes.trim() };
      if (matterToEdit) {
        await updateMatterDetails(matterToEdit.id, base);
        showToast('Matter updated', `The record for ${base.suitNumber} is current.`, 'success');
      } else {
        await saveMatter({ ...base, plaintiffs: base.plaintiffs.length ? base.plaintiffs : ['Claimant'], defendants: base.defendants.length ? base.defendants : ['Respondent'], createdBy: currentUser.uid, createdByName: currentUser.name }, currentUser.uid, currentUser.name);
        showToast('Matter opened', `${base.suitNumber} is now in your private register.`, 'success');
      }
      onSaved(); onClose();
    } catch (error) {
      // A conflict can still surface here if someone else claimed the same
      // suit number between the review check and confirmation - send the
      // user back to the form so they can see and fix it.
      setErrorMessage(error instanceof Error ? error.message : 'The matter could not be saved.');
      setStep('form');
    } finally { setSubmitting(false); }
  };

  if (step === 'review') {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="matter-review-title">
        <div className="modal-shell max-w-3xl">
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <span className="modal-icon"><Check className="h-5 w-5" /></span>
              <div>
                <p className="eyebrow">Confirm before saving</p>
                <h2 id="matter-review-title" className="font-serif-title text-[21px] font-semibold">Is this correct?</h2>
              </div>
            </div>
            <button onClick={onClose} className="icon-button"><X className="h-5 w-5" /></button>
          </div>
          <div className="modal-body">
            <p className="mb-5 max-w-2xl text-[12px] leading-5 text-[var(--text-muted)]">
              Review the details below. You can go back and edit anything before it's written to the register.
            </p>
            {errorMessage && <div className="alert-box mb-4"><AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}

            <div className="rounded-xl border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
              <ReviewSection title="Identity & jurisdiction">
                <ReviewRow label="Suit number" value={form.suitNumber} mono />
                <ReviewRow label="Matter title / cause" value={form.title} />
                <ReviewRow label="Court & division" value={form.court || '—'} />
                <ReviewRow label="Presiding judge" value={form.judge || '—'} />
                <ReviewRow label="Plot / subject property" value={form.plot || '—'} mono />
              </ReviewSection>
              <ReviewSection title="Parties & ownership">
                <ReviewRow label="Claimant(s) / plaintiff(s)" value={form.plaintiffs || 'Claimant (default)'} />
                <ReviewRow label="Respondent(s) / defendant(s)" value={form.defendants || 'Respondent (default)'} />
                <ReviewRow label="Lead counsel" value={form.leadLawyerName || currentUser?.name || '—'} />
                <ReviewRow label="Status" value={form.status} />
              </ReviewSection>
              <ReviewSection title="Diary & context">
                <ReviewRow label="Filing date" value={form.filingDate} />
                <ReviewRow label="Next hearing" value={form.nextHearingDate || 'Not set'} />
                <ReviewRow label="Purpose" value={form.purpose || '—'} />
                <ReviewRow label="Appearances record" value={form.appearances || '—'} />
                <ReviewRow label="Summary notes" value={form.summaryNotes || '—'} />
              </ReviewSection>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setStep('form')} className="button-secondary">
                <ArrowLeft className="h-4 w-4" /> Edit
              </button>
              <button type="button" disabled={submitting} onClick={handleConfirmSave} className="button-primary">
                {submitting ? 'Saving…' : matterToEdit ? 'Confirm & save changes' : 'Confirm & open matter'} <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="matter-form-title"><div className="modal-shell max-w-3xl"><div className="modal-header"><div className="flex items-center gap-3"><span className="modal-icon"><Gavel className="h-5 w-5" /></span><div><p className="eyebrow">{matterToEdit ? 'Edit record' : 'New record'}</p><h2 id="matter-form-title" className="font-serif-title text-[21px] font-semibold">{matterToEdit ? `Edit ${matterToEdit.suitNumber}` : 'Open a new matter'}</h2></div></div><button onClick={onClose} className="icon-button"><X className="h-5 w-5" /></button></div>
    <div className="modal-body"><p className="mb-5 max-w-2xl text-[12px] leading-5 text-[var(--text-muted)]">Capture only what you need at intake. You can add the full procedural history, documents, and collaborators from the matter workspace.</p>
      {errorMessage && <div className="alert-box"><AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
      <form onSubmit={handleContinueToReview} className="space-y-5">
        <FormSection icon={<FileText />} title="Identity & jurisdiction" description="The information that makes this record findable."><div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]"><Field label="Suit number" required value={form.suitNumber} onChange={(value) => update('suitNumber', value)} placeholder="e.g. E/968/2022" mono /><Field label="Matter title / cause" required value={form.title} onChange={(value) => update('title', value)} placeholder="Claimant v. Respondent" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Court & division" value={form.court} onChange={(value) => update('court', value)} placeholder="High Court · Civil Division" /><Field label="Presiding judge" value={form.judge} onChange={(value) => update('judge', value)} placeholder="Hon. Justice …" /></div><Field label="Plot / subject property" value={form.plot} onChange={(value) => update('plot', value)} placeholder="Optional property or subject reference" mono /></FormSection>
        <FormSection icon={<Gavel />} title="Parties & ownership" description="Names are separated by commas. Matter access is private to the people you invite."><div className="grid gap-4 sm:grid-cols-2"><TextAreaField label="Claimant(s) / plaintiff(s)" value={form.plaintiffs} onChange={(value) => update('plaintiffs', value)} placeholder="Name 1, Name 2" /><TextAreaField label="Respondent(s) / defendant(s)" value={form.defendants} onChange={(value) => update('defendants', value)} placeholder="Name 1, Name 2" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Lead counsel" value={form.leadLawyerName} onChange={(value) => update('leadLawyerName', value)} placeholder={currentUser?.name || 'Counsel'} /><Field label="Status" value={form.status} onChange={(value) => update('status', value as MatterStatus)} select options={['active', 'adjourned', 'won', 'lost', 'closed']} /></div></FormSection>
        <FormSection icon={<CalendarDays />} title="Diary & context" description="Set the next moment that should bring this matter back to your attention."><div className="grid gap-4 sm:grid-cols-3"><Field label="Filing date" type="date" value={form.filingDate} onChange={(value) => update('filingDate', value)} /><Field label="Next hearing" type="date" value={form.nextHearingDate} onChange={(value) => update('nextHearingDate', value)} /><Field label="Purpose" value={form.purpose} onChange={(value) => update('purpose', value)} placeholder="Mention, PTC, Hearing…" /></div><Field label="Appearances record" value={form.appearances} onChange={(value) => update('appearances', value)} placeholder="Counsel appearing for each side" /><TextAreaField label="Summary notes" value={form.summaryNotes} onChange={(value) => update('summaryNotes', value)} placeholder="Background, relief sought, or the next strategic question…" rows={4} /></FormSection>
        <div className="modal-footer"><span className="mr-auto hidden text-[11px] text-[var(--text-muted)] sm:block">You can refine this record later.</span><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="submit" disabled={submitting} className="button-primary">{submitting ? 'Checking…' : 'Review before saving'} <ArrowRight className="h-4 w-4" /></button></div>
      </form>
    </div></div></div>;
}

function FormSection({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) { return <section className="form-section"><div className="mb-4 flex items-start gap-3"><span className="section-icon">{icon}</span><div><h3 className="text-[13px] font-semibold text-[var(--text-main)]">{title}</h3><p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">{description}</p></div></div>{children}</section>; }
function ReviewSection({ title, children }: { title: string; children: ReactNode }) { return <div className="p-4"><h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</h3><div className="grid gap-3 sm:grid-cols-2">{children}</div></div>; }
function ReviewRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div><p className="eyebrow mb-1">{label}</p><p className={`text-[13px] font-medium text-[var(--text-main)] ${mono ? 'font-mono' : ''}`}>{value}</p></div>; }
function Field({ label, value, onChange, placeholder, type = 'text', required = false, mono = false, select = false, options = [] }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; mono?: boolean; select?: boolean; options?: string[] }) { return <label className="block text-[11px] font-medium text-[var(--text-muted)]">{label}{required && <span className="ml-1 text-[var(--alert-red)]">*</span>}{select ? <select required={required} value={value} onChange={(event) => onChange(event.target.value)} className={`field-control mt-1.5 w-full ${mono ? 'font-mono' : ''}`}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`field-control mt-1.5 w-full ${mono ? 'font-mono' : ''}`} />}</label>; }
function TextAreaField({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) { return <label className="block text-[11px] font-medium text-[var(--text-muted)]">{label}<textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field-control mt-1.5 w-full resize-y" /></label>; }
