import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, CalendarDays, FileText, Gavel, X } from 'lucide-react';
import { Matter, MatterStatus } from '../../types';
import { saveMatter, updateMatterDetails } from '../../services/matterService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { todayISO } from '../../utils/dates';

interface MatterFormModalProps { isOpen: boolean; onClose: () => void; matterToEdit?: Matter | null; onSaved: () => void; }

const emptyForm = { suitNumber: '', title: '', court: '', judge: '', plot: '', plaintiffs: '', defendants: '', status: 'active' as MatterStatus, filingDate: todayISO(), nextHearingDate: '', purpose: 'Hearing', appearances: '', summaryNotes: '' };

type FormState = typeof emptyForm;

export function MatterFormModal({ isOpen, onClose, matterToEdit, onSaved }: MatterFormModalProps) {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (!matterToEdit) { setForm({ ...emptyForm, filingDate: todayISO() }); setErrorMessage(''); return; }
    setForm({ suitNumber: matterToEdit.suitNumber, title: matterToEdit.title, court: matterToEdit.court || '', judge: matterToEdit.judge || '', plot: matterToEdit.plot || '', plaintiffs: matterToEdit.plaintiffs.join(', '), defendants: matterToEdit.defendants.join(', '), status: matterToEdit.status, filingDate: matterToEdit.filingDate || emptyForm.filingDate, nextHearingDate: matterToEdit.nextHearingDate || '', purpose: matterToEdit.purpose || '', appearances: matterToEdit.appearances || '', summaryNotes: matterToEdit.summaryNotes || '' });
    setErrorMessage('');
  }, [isOpen, matterToEdit]);

  if (!isOpen) return null;
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const splitPeople = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (!currentUser) { setErrorMessage('Please sign in before opening a matter.'); return; }

    const plaintiffs = splitPeople(form.plaintiffs);
    const defendants = splitPeople(form.defendants);

    if (!form.suitNumber.trim() || plaintiffs.length === 0) {
      setErrorMessage('Please add the suit number and at least one claimant.');
      return;
    }

    // Everything else (title, court, judge, defendants, dates...) can be filled in
    // later - a suit number and plaintiff is enough to open a
    // placeholder record you can flesh out as the matter develops.
    // Title auto-generates from the parties when left blank, so the matter
    // never shows up with an empty heading on cards or in the header.
    const autoTitle = `${plaintiffs.join(' & ')} v. ${defendants.length ? defendants.join(' & ') : 'Respondent(s) TBD'}`;

    setSubmitting(true);
    try {
      const base = { suitNumber: form.suitNumber.trim(), title: form.title.trim() || autoTitle, court: form.court.trim(), judge: form.judge.trim(), plot: form.plot.trim(), plaintiffs, defendants, status: form.status, filingDate: form.filingDate, nextHearingDate: form.nextHearingDate || undefined, purpose: form.purpose.trim(), appearances: form.appearances.trim(), summaryNotes: form.summaryNotes.trim() };
      if (matterToEdit) {
        await updateMatterDetails(matterToEdit.id, base);
        showToast('Matter updated', `The record for ${base.suitNumber} is current.`, 'success');
      } else {
        await saveMatter({ ...base, createdBy: currentUser.uid, createdByName: currentUser.name }, currentUser.uid, currentUser.name);
        showToast('Matter added', `${base.suitNumber} is saved. Only you can see it until you share it.`, 'success');
      }
      onSaved(); onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The matter could not be saved.');
    } finally { setSubmitting(false); }
  };

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="matter-form-title"><div className="modal-shell max-w-3xl"><div className="modal-header"><div className="flex items-center gap-3"><span className="modal-icon"><Gavel className="h-5 w-5" /></span><div><h2 id="matter-form-title" className="font-serif-title text-[21px] font-semibold">{matterToEdit ? `Edit ${matterToEdit.suitNumber}` : 'New matter'}</h2></div></div><button onClick={onClose} className="icon-button" aria-label="Close"><X className="h-5 w-5" /></button></div>
    <div className="modal-body"><p className="mb-5 max-w-2xl text-[12px] leading-5 text-[var(--text-muted)]">Only the fields marked * are needed now. You can add the rest later from the matter page.</p>
      {errorMessage && <div className="alert-box"><AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection icon={<FileText />} title="The case" description="The suit number is required. Court and judge can be added later."><div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]"><Field label="Suit number" required value={form.suitNumber} onChange={(value) => update('suitNumber', value)} placeholder="e.g. E/968/2022" mono /><Field label="Case name" value={form.title} onChange={(value) => update('title', value)} placeholder="Optional — we'll use “Claimant v. Respondent”" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Court" value={form.court} onChange={(value) => update('court', value)} placeholder="High Court · Civil Division" /><Field label="Judge" value={form.judge} onChange={(value) => update('judge', value)} placeholder="Hon. Justice …" /></div><Field label="Property / subject (optional)" value={form.plot} onChange={(value) => update('plot', value)} placeholder="e.g. Plot 33, Independence Layout" mono /></FormSection>
        <FormSection icon={<Gavel />} title="The parties" description="Separate several names with commas."><div className="grid gap-4 sm:grid-cols-2"><TextAreaField label="Claimant(s) / plaintiff(s) *" value={form.plaintiffs} onChange={(value) => update('plaintiffs', value)} placeholder="Name 1, Name 2" /><TextAreaField label="Respondent(s) / defendant(s)" value={form.defendants} onChange={(value) => update('defendants', value)} placeholder="Leave blank if not yet known" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Status" value={form.status} onChange={(value) => update('status', value as MatterStatus)} select options={['active', 'adjourned', 'won', 'lost', 'closed']} /></div></FormSection>
        <FormSection icon={<CalendarDays />} title="Dates & notes" description="Set the next hearing date and everyone on this matter gets a reminder the day before."><div className="grid gap-4 sm:grid-cols-3"><Field label="Filing date" type="date" value={form.filingDate} onChange={(value) => update('filingDate', value)} /><Field label="Next hearing date" type="date" value={form.nextHearingDate} onChange={(value) => update('nextHearingDate', value)} /><Field label="Next hearing is for" value={form.purpose} onChange={(value) => update('purpose', value)} placeholder="e.g. Mention, Pre-trial conference" /></div><Field label="Lawyers appearing" value={form.appearances} onChange={(value) => update('appearances', value)} placeholder="Who appears for each side" /><TextAreaField label="Notes" value={form.summaryNotes} onChange={(value) => update('summaryNotes', value)} placeholder="Background, relief sought, or the next strategic question…" rows={4} /></FormSection>
        <div className="modal-footer"><span className="mr-auto hidden text-[13px] text-[var(--text-muted)] sm:block">You can change any of this later.</span><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="submit" disabled={submitting} className="button-primary">{submitting ? 'Saving…' : matterToEdit ? 'Save changes' : 'Save matter'} <ArrowRight className="h-4 w-4" /></button></div>
      </form>
    </div></div></div>;
}

function FormSection({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) { return <section className="form-section"><div className="mb-4 flex items-start gap-3"><span className="section-icon">{icon}</span><div><h3 className="text-[15px] font-semibold text-[var(--text-main)]">{title}</h3><p className="mt-1 text-[13px] leading-5 text-[var(--text-muted)]">{description}</p></div></div>{children}</section>; }
function Field({ label, value, onChange, placeholder, type = 'text', required = false, mono = false, select = false, options = [] }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; mono?: boolean; select?: boolean; options?: string[] }) { return <label className="block text-[13px] font-medium text-[var(--text-main)]">{label}{required && <span className="ml-1 text-[var(--alert-red)]">*</span>}{select ? <select required={required} value={value} onChange={(event) => onChange(event.target.value)} className={`field-control mt-1.5 w-full ${mono ? 'font-mono' : ''}`}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`field-control mt-1.5 w-full ${mono ? 'font-mono' : ''}`} />}</label>; }
function TextAreaField({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) { return <label className="block text-[13px] font-medium text-[var(--text-main)]">{label}<textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field-control mt-1.5 w-full resize-y" /></label>; }
