import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, CalendarDays, FileText, Gavel, X } from 'lucide-react';
import { Matter, MatterStatus } from '../../types';
import { saveMatter, updateMatterDetails } from '../../services/matterService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface MatterFormModalProps { isOpen: boolean; onClose: () => void; matterToEdit?: Matter | null; onSaved: () => void; }

const emptyForm = { suitNumber: '', title: '', court: '', judge: '', plot: '', plaintiffs: '', defendants: '', leadLawyerName: '', status: 'active' as MatterStatus, filingDate: new Date().toISOString().slice(0, 10), nextHearingDate: '', purpose: 'Hearing', appearances: '', summaryNotes: '' };

type FormState = typeof emptyForm;

export function MatterFormModal({ isOpen, onClose, matterToEdit, onSaved }: MatterFormModalProps) {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (!matterToEdit) { setForm({ ...emptyForm, leadLawyerName: currentUser?.name || '' }); return; }
    setForm({ suitNumber: matterToEdit.suitNumber, title: matterToEdit.title, court: matterToEdit.court || '', judge: matterToEdit.judge || '', plot: matterToEdit.plot || '', plaintiffs: matterToEdit.plaintiffs.join(', '), defendants: matterToEdit.defendants.join(', '), leadLawyerName: matterToEdit.ownerName || '', status: matterToEdit.status, filingDate: matterToEdit.filingDate || emptyForm.filingDate, nextHearingDate: matterToEdit.nextHearingDate || '', purpose: matterToEdit.purpose || '', appearances: matterToEdit.appearances || '', summaryNotes: matterToEdit.summaryNotes || '' });
    setErrorMessage('');
  }, [isOpen, matterToEdit, currentUser?.name]);

  if (!isOpen) return null;
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const splitPeople = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (!currentUser) { setErrorMessage('Please sign in before opening a matter.'); return; }

    const plaintiffs = splitPeople(form.plaintiffs);
    const defendants = splitPeople(form.defendants);

    if (!form.suitNumber.trim() || !form.judge.trim() || plaintiffs.length === 0) {
      setErrorMessage('Suit number, presiding judge, and at least one claimant/plaintiff are required.');
      return;
    }

    // Everything else (title, court, defendants, dates...) can be filled in
    // later - a suit number, judge, and plaintiff is enough to open a
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
        showToast('Matter opened', `${base.suitNumber} is now in your private register.`, 'success');
      }
      onSaved(); onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The matter could not be saved.');
    } finally { setSubmitting(false); }
  };

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="matter-form-title"><div className="modal-shell max-w-3xl"><div className="modal-header"><div className="flex items-center gap-3"><span className="modal-icon"><Gavel className="h-5 w-5" /></span><div><p className="eyebrow">{matterToEdit ? 'Edit record' : 'New record'}</p><h2 id="matter-form-title" className="font-serif-title text-[21px] font-semibold">{matterToEdit ? `Edit ${matterToEdit.suitNumber}` : 'Open a new matter'}</h2></div></div><button onClick={onClose} className="icon-button"><X className="h-5 w-5" /></button></div>
    <div className="modal-body"><p className="mb-5 max-w-2xl text-[12px] leading-5 text-[var(--text-muted)]">Capture only what you need at intake. You can add the full procedural history, documents, and collaborators from the matter workspace.</p>
      {errorMessage && <div className="alert-box"><AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection icon={<FileText />} title="Identity & jurisdiction" description="Only the suit number is required here. Everything else can be filled in as the matter develops."><div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]"><Field label="Suit number" required value={form.suitNumber} onChange={(value) => update('suitNumber', value)} placeholder="e.g. E/968/2022" mono /><Field label="Matter title / cause" value={form.title} onChange={(value) => update('title', value)} placeholder="Leave blank to auto-generate from parties below" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Court & division" value={form.court} onChange={(value) => update('court', value)} placeholder="High Court · Civil Division" /><Field label="Presiding judge" required value={form.judge} onChange={(value) => update('judge', value)} placeholder="Hon. Justice …" /></div><Field label="Plot / subject property" value={form.plot} onChange={(value) => update('plot', value)} placeholder="Optional property or subject reference" mono /></FormSection>
        <FormSection icon={<Gavel />} title="Parties & ownership" description="At least one claimant/plaintiff is required. Names are separated by commas. Matter access is private to the people you invite."><div className="grid gap-4 sm:grid-cols-2"><TextAreaField label="Claimant(s) / plaintiff(s) *" value={form.plaintiffs} onChange={(value) => update('plaintiffs', value)} placeholder="Name 1, Name 2" /><TextAreaField label="Respondent(s) / defendant(s)" value={form.defendants} onChange={(value) => update('defendants', value)} placeholder="Leave blank if not yet known, e.g. PERSONS UNKNOWN" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Lead counsel" value={form.leadLawyerName} onChange={(value) => update('leadLawyerName', value)} placeholder={currentUser?.name || 'Counsel'} /><Field label="Status" value={form.status} onChange={(value) => update('status', value as MatterStatus)} select options={['active', 'adjourned', 'won', 'lost', 'closed']} /></div></FormSection>
        <FormSection icon={<CalendarDays />} title="Diary & context" description="Set the next moment that should bring this matter back to your attention."><div className="grid gap-4 sm:grid-cols-3"><Field label="Filing date" type="date" value={form.filingDate} onChange={(value) => update('filingDate', value)} /><Field label="Next hearing" type="date" value={form.nextHearingDate} onChange={(value) => update('nextHearingDate', value)} /><Field label="Purpose" value={form.purpose} onChange={(value) => update('purpose', value)} placeholder="Mention, PTC, Hearing…" /></div><Field label="Appearances record" value={form.appearances} onChange={(value) => update('appearances', value)} placeholder="Counsel appearing for each side" /><TextAreaField label="Summary notes" value={form.summaryNotes} onChange={(value) => update('summaryNotes', value)} placeholder="Background, relief sought, or the next strategic question…" rows={4} /></FormSection>
        <div className="modal-footer"><span className="mr-auto hidden text-[11px] text-[var(--text-muted)] sm:block">You can refine this record later.</span><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="submit" disabled={submitting} className="button-primary">{submitting ? 'Saving…' : matterToEdit ? 'Save changes' : 'Open matter'} <ArrowRight className="h-4 w-4" /></button></div>
      </form>
    </div></div></div>;
}

function FormSection({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) { return <section className="form-section"><div className="mb-4 flex items-start gap-3"><span className="section-icon">{icon}</span><div><h3 className="text-[13px] font-semibold text-[var(--text-main)]">{title}</h3><p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">{description}</p></div></div>{children}</section>; }
function Field({ label, value, onChange, placeholder, type = 'text', required = false, mono = false, select = false, options = [] }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; mono?: boolean; select?: boolean; options?: string[] }) { return <label className="block text-[11px] font-medium text-[var(--text-muted)]">{label}{required && <span className="ml-1 text-[var(--alert-red)]">*</span>}{select ? <select required={required} value={value} onChange={(event) => onChange(event.target.value)} className={`field-control mt-1.5 w-full ${mono ? 'font-mono' : ''}`}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`field-control mt-1.5 w-full ${mono ? 'font-mono' : ''}`} />}</label>; }
function TextAreaField({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) { return <label className="block text-[11px] font-medium text-[var(--text-muted)]">{label}<textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field-control mt-1.5 w-full resize-y" /></label>; }
