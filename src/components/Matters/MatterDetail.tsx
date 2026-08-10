import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Gavel,
  FileText,
  Clock,
  Users,
  Bell,
  Printer,
  Plus,
  Upload,
  Calendar,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Trash2,
  Lock,
} from 'lucide-react';
import { Matter, TimelineEvent, MatterDocument, Reminder, UserRole } from '../../types';
import {
  fetchTimelineEvents,
  addTimelineEvent,
  fetchMatterDocuments,
  uploadMatterDocument,
  createReminder,
  updateMatterDetails,
  deleteMatterById,
} from '../../services/matterService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { printCaseBundle } from '../../utils/caseBundleGenerator';
import { calculateStatutoryDeadlines } from '../../utils/deadlineCalculator';

interface MatterDetailProps {
  matter: Matter;
  onBack: () => void;
  onRefresh: () => void;
}

export const MatterDetail: React.FC<MatterDetailProps> = ({ matter, onBack, onRefresh }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'documents' | 'team' | 'reminders'>('overview');

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<MatterDocument[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // New Timeline Event State
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventType, setEventType] = useState<TimelineEvent['type']>('hearing');
  const [eventSummary, setEventSummary] = useState('');
  const [eventPurpose, setEventPurpose] = useState(matter.purpose || '');
  const [eventAppearances, setEventAppearances] = useState(matter.appearances || '');

  // New Document Upload State
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [fileName, setFileName] = useState('');
  const [docType, setDocType] = useState<MatterDocument['docType']>('pleading');
  const [docDescription, setDocDescription] = useState('');

  // New Reminder State
  const [remindAtDate, setRemindAtDate] = useState('');
  const [remindMsg, setRemindMsg] = useState(`Hearing for ${matter.suitNumber} before ${matter.judge || 'Court'}`);

  // New Team Member Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('paralegal');

  useEffect(() => {
    loadSubData();
  }, [matter.id]);

  const loadSubData = async () => {
    setLoadingData(true);
    const [tList, dList] = await Promise.all([
      fetchTimelineEvents(matter.id),
      fetchMatterDocuments(matter.id),
    ]);
    setTimeline(tList);
    setDocuments(dList);
    setLoadingData(false);
  };

  const deadlines = calculateStatutoryDeadlines(matter.court, matter.filingDate);

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary.trim()) return;

    await addTimelineEvent(matter.id, {
      date: eventDate,
      type: eventType,
      summary: eventSummary.trim(),
      judge: matter.judge,
      purpose: eventPurpose,
      appearances: eventAppearances,
      createdBy: currentUser?.uid || 'user_demo',
      createdByName: currentUser?.name || 'Counsel',
    });

    // Also update next hearing date if applicable
    if (eventType === 'hearing' && eventDate >= new Date().toISOString().split('T')[0]) {
      await updateMatterDetails(
        matter.id,
        { nextHearingDate: eventDate, purpose: eventPurpose, appearances: eventAppearances },
        currentUser?.uid || 'user',
        currentUser?.name || 'Counsel'
      );
      onRefresh();
    }

    showToast('Timeline Updated', 'Hearing record added to cause list history.', 'success');
    setEventSummary('');
    setShowAddTimeline(false);
    loadSubData();
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    await uploadMatterDocument(matter.id, {
      fileName: fileName.trim().endsWith('.pdf') ? fileName.trim() : `${fileName.trim()}.pdf`,
      storagePath: `matters/${matter.id}/${fileName.trim()}`,
      fileSize: 1048576,
      fileType: 'application/pdf',
      docType,
      uploadedBy: currentUser?.uid || 'user_demo',
      uploadedByName: currentUser?.name || 'Counsel',
      version: 1,
      description: docDescription.trim(),
    });

    showToast('Document Vault', `Document "${fileName}" deposited successfully.`, 'success');
    setFileName('');
    setDocDescription('');
    setShowAddDoc(false);
    loadSubData();
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remindAtDate) return;

    await createReminder({
      userId: currentUser?.uid || 'user_demo',
      matterId: matter.id,
      suitNumber: matter.suitNumber,
      remindAt: new Date(remindAtDate).toISOString(),
      message: remindMsg,
      channel: ['email', 'inApp'],
    });

    showToast('Reminder Scheduled', `Hearing alert set for ${matter.suitNumber}.`, 'success');
    setRemindAtDate('');
  };

  const handleInviteTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    showToast('Invite Dispatched', `Access invite sent to ${inviteEmail}.`, 'success');
    setInviteEmail('');
  };

  const handleDeleteMatter = async () => {
    if (window.confirm(`Are you sure you want to delete Suit No. ${matter.suitNumber}?`)) {
      await deleteMatterById(matter.id);
      showToast('Matter Deleted', `Suit ${matter.suitNumber} removed from registry.`, 'warning');
      onRefresh();
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-amber-600 dark:text-amber-400">
                {matter.suitNumber}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  matter.status === 'active'
                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                    : matter.status === 'adjourned'
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    : matter.status === 'won'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                }`}
              >
                {matter.status}
              </span>
            </div>
            <h1 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
              {matter.title}
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => printCaseBundle(matter, timeline, documents)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Print Case Brief
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={handleDeleteMatter}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              title="Delete Matter"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Gavel className="w-4 h-4" /> Overview & Cause Brief
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'timeline'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" /> Timeline ({timeline.length})
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'documents'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Document Vault ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'team'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Team Access ({matter.teamMembers.length})
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'reminders'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" /> Hearing Reminders
        </button>
      </div>

      {/* Tab Contents */}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Core Details Panel */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                Litigation Brief & Jurisdiction
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Presiding Judge</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">{matter.judge || 'Not Assigned'}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Court Division</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">{matter.court}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Subject Matter / Land Plot</div>
                  <div className="font-mono font-semibold text-amber-600 dark:text-amber-400 mt-1">{matter.plot || 'N/A'}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 uppercase font-bold text-[10px]">Lead Litigation Counsel</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">{matter.leadLawyerName || matter.leadLawyer}</div>
                </div>
              </div>

              {/* Parties Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 uppercase text-[10px] mb-1">
                    Claimant(s) / Plaintiff(s)
                  </div>
                  <ul className="list-disc list-inside space-y-1 font-medium text-slate-800 dark:text-slate-200">
                    {matter.plaintiffs.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <div className="font-bold text-rose-700 dark:text-rose-400 uppercase text-[10px] mb-1">
                    Defendant(s) / Respondent(s)
                  </div>
                  <ul className="list-disc list-inside space-y-1 font-medium text-slate-800 dark:text-slate-200">
                    {matter.defendants.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Case Summary */}
              <div className="pt-2">
                <div className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                  Summary Notes & Background
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                  {matter.summaryNotes || 'No summary notes provided for this suit.'}
                </p>
              </div>

            </div>

            {/* Statutory Deadline Analysis Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Statutory Procedural Deadlines
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Calculated windows based on filing date ({matter.filingDate}) and court civil rules ({deadlines.courtType}).
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold">Claim Due</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{deadlines.statementOfClaimDue}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold">Defense Due</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{deadlines.defenseDue}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold">Reply Due</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{deadlines.replyDue}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold">PTC Window</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{deadlines.preTrialConferenceMaxDate}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                {deadlines.statutoryNotes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Hearing Countdown Box */}
            <div className="p-6 rounded-2xl bg-amber-600 text-white shadow-lg space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Next Court Date
              </div>
              <div className="text-3xl font-extrabold tracking-tight">
                {matter.nextHearingDate || 'Unscheduled'}
              </div>
              <div className="text-xs text-amber-100 flex items-center gap-1.5 font-medium">
                <Gavel className="w-4 h-4" />
                Purpose: <span className="font-bold underline">{matter.purpose || 'Hearing'}</span>
              </div>
              <div className="pt-2 border-t border-amber-500/40 text-[11px] text-amber-100">
                Appearances: {matter.appearances || 'To be recorded'}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Matter Controls</div>
              
              <button
                onClick={() => setActiveTab('timeline')}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 text-left flex items-center justify-between"
              >
                <span>Log Court Outcome</span>
                <Plus className="w-4 h-4 text-amber-600" />
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 text-left flex items-center justify-between"
              >
                <span>Deposit Pleadings / Exhibit</span>
                <Upload className="w-4 h-4 text-amber-600" />
              </button>

              <button
                onClick={() => setActiveTab('reminders')}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 text-left flex items-center justify-between"
              >
                <span>Schedule Hearing Alert</span>
                <Bell className="w-4 h-4 text-amber-600" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
                Cause List History & Hearing Outcomes
              </h2>
              <p className="text-xs text-slate-500">
                Chronological record of court sittings, rulings, filings, and adjourning orders.
              </p>
            </div>

            <button
              onClick={() => setShowAddTimeline(!showAddTimeline)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
            >
              <Plus className="w-4 h-4" /> Log Court Outcome
            </button>
          </div>

          {/* Log New Timeline Event Form */}
          {showAddTimeline && (
            <form onSubmit={handleAddTimeline} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">Log New Court Sitting / Outcome</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold mb-1">Sitting Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as TimelineEvent['type'])}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="hearing">Hearing Sitting</option>
                    <option value="ruling">Court Ruling</option>
                    <option value="filing">Pleading Filing</option>
                    <option value="note">Internal Case Note</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Sitting Purpose</label>
                  <input
                    type="text"
                    value={eventPurpose}
                    onChange={(e) => setEventPurpose(e.target.value)}
                    placeholder="e.g. Mention, P.T.C, Ruling"
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Appearances Recorded</label>
                <input
                  type="text"
                  value={eventAppearances}
                  onChange={(e) => setEventAppearances(e.target.value)}
                  placeholder="e.g. Chisom Esq. for Claimant, N.O. Egwu Esq. for Defendant"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Sitting Summary & Proceedings Notes</label>
                <textarea
                  rows={3}
                  required
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  placeholder="Record what transpired in court, witness cross-examination summary, or judge orders..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTimeline(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          )}

          {/* Timeline Feed */}
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {timeline.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No timeline events recorded yet.</div>
            ) : (
              timeline.map((item) => (
                <div key={item.id} className="relative pl-10">
                  <div className="absolute left-2 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-600 ring-4 ring-white dark:ring-slate-900" />
                  
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{item.date}</span>
                      <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {item.type}
                      </span>
                    </div>

                    <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {item.summary}
                    </p>

                    {item.appearances && (
                      <div className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        Appearances: {item.appearances}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400">
                      Recorded by {item.createdByName || item.createdBy}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
                Document Vault & Exhibits Registry
              </h2>
              <p className="text-xs text-slate-500">
                Indexed repository for court pleadings, sworn affidavits, and trial exhibits.
              </p>
            </div>

            <button
              onClick={() => setShowAddDoc(!showAddDoc)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
            >
              <Upload className="w-4 h-4" /> Deposit Document
            </button>
          </div>

          {showAddDoc && (
            <form onSubmit={handleUploadDoc} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">Deposit New Court Document</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Document File Name</label>
                  <input
                    type="text"
                    required
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. Motion_for_Interlocutory_Injunction"
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Document Category</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as MatterDocument['docType'])}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="pleading">Pleading / Writ</option>
                    <option value="motion">Motion / Application</option>
                    <option value="exhibit">Trial Exhibit</option>
                    <option value="judgment">Judgment / Order</option>
                    <option value="affidavit">Sworn Affidavit</option>
                    <option value="correspondence">Correspondence</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Description / Stamp Reference</label>
                <input
                  type="text"
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  placeholder="e.g. Certified True Copy filed at High Court Registry"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoc(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold"
                >
                  Deposit Document
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-400 text-xs">No documents uploaded.</div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start justify-between">
                  <div className="space-y-1 text-xs">
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      {doc.fileName}
                    </div>
                    <div className="text-slate-500 text-[11px]">{doc.description || 'No description provided.'}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-1">
                      <span className="uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{doc.docType}</span>
                      <span>v{doc.version}</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => showToast('Document Download', `Downloading ${doc.fileName}...`, 'info')}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white transition text-xs font-semibold"
                  >
                    Download
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TEAM TAB */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
                Team Access Control & Permissions
              </h2>
              <p className="text-xs text-slate-500">
                Grant or revoke counsel and paralegal access to suit files.
              </p>
            </div>
          </div>

          <form onSubmit={handleInviteTeam} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">Invite Team Member / Co-Counsel</div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@lawfirm.com"
                className="flex-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="lawyer">Co-Counsel (Lawyer)</option>
                <option value="paralegal">Paralegal</option>
                <option value="client">Client Viewer (Read Only)</option>
              </select>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold"
              >
                Send Invite
              </button>
            </div>
          </form>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Authorized Team Members ({matter.teamMembers.length})</div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {matter.teamMembers.map((uid) => (
                <div key={uid} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{uid}</div>
                      <div className="text-[10px] text-slate-400">Granted active access to suit</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    MEMBER
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REMINDERS TAB */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
              Hearing Alerts & Reminder Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Configure automated hearing date reminders sent via email and in-app feed.
            </p>
          </div>

          <form onSubmit={handleCreateReminder} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">Schedule Alert Notification</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">Alert Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={remindAtDate}
                  onChange={(e) => setRemindAtDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Notification Message</label>
                <input
                  type="text"
                  required
                  value={remindMsg}
                  onChange={(e) => setRemindMsg(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold"
              >
                Schedule Hearing Alert
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
