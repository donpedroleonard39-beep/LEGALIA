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
import { DocketStamp } from '../common/DocketStamp';

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
      <div className="legal-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-lg bg-[#EDE8DC] dark:bg-[#1B2140] hover:bg-[#E3DDD0] dark:hover:bg-[#232A50] transition text-[#12172B] dark:text-[#F6F3EC]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-[#B8935F]">
                {matter.suitNumber}
              </span>
              <DocketStamp status={matter.status} size="sm" />
            </div>
            <h1 className="font-serif font-semibold text-lg text-[#12172B] dark:text-[#F6F3EC] mt-0.5">
              {matter.title}
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => printCaseBundle(matter, timeline, documents)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#12172B] dark:bg-[#1B2140] hover:bg-[#1B2140] dark:hover:bg-[#232A50] text-[#F6F3EC] text-[13px] font-semibold transition border border-[rgba(184,147,95,0.3)]"
          >
            <Printer className="w-4 h-4 text-[#B8935F]" />
            Print Case Brief
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={handleDeleteMatter}
              className="p-2 rounded-lg text-[#C1554A] hover:bg-[#C1554A]/10 transition"
              title="Delete Matter"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-[rgba(184,147,95,0.2)] text-[13px] font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-[#B8935F] text-[#B8935F] font-bold'
              : 'border-transparent text-[#8A90AC] hover:text-[#12172B] dark:hover:text-[#F6F3EC]'
          }`}
        >
          <Gavel className="w-4 h-4" /> Overview & Cause Brief
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'timeline'
              ? 'border-[#B8935F] text-[#B8935F] font-bold'
              : 'border-transparent text-[#8A90AC] hover:text-[#12172B] dark:hover:text-[#F6F3EC]'
          }`}
        >
          <Clock className="w-4 h-4" /> Timeline ({timeline.length})
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'documents'
              ? 'border-[#B8935F] text-[#B8935F] font-bold'
              : 'border-transparent text-[#8A90AC] hover:text-[#12172B] dark:hover:text-[#F6F3EC]'
          }`}
        >
          <FileText className="w-4 h-4" /> Document Vault ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'team'
              ? 'border-[#B8935F] text-[#B8935F] font-bold'
              : 'border-transparent text-[#8A90AC] hover:text-[#12172B] dark:hover:text-[#F6F3EC]'
          }`}
        >
          <Users className="w-4 h-4" /> Team Access ({matter.teamMembers.length})
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
            activeTab === 'reminders'
              ? 'border-[#B8935F] text-[#B8935F] font-bold'
              : 'border-transparent text-[#8A90AC] hover:text-[#12172B] dark:hover:text-[#F6F3EC]'
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
            <div className="legal-card p-6 space-y-4">
              <h3 className="font-serif font-semibold text-base text-[#12172B] dark:text-[#F6F3EC] border-b border-[rgba(184,147,95,0.2)] pb-2">
                Litigation Brief & Jurisdiction
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                <div className="p-3 rounded-lg bg-[#EDE8DC]/50 dark:bg-[#12172B] border border-[rgba(184,147,95,0.15)]">
                  <div className="text-[#8A90AC] uppercase font-mono font-semibold text-[11px]">Presiding Judge</div>
                  <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC] mt-1">{matter.judge || 'Not Assigned'}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#EDE8DC]/50 dark:bg-[#12172B] border border-[rgba(184,147,95,0.15)]">
                  <div className="text-[#8A90AC] uppercase font-mono font-semibold text-[11px]">Court Division</div>
                  <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC] mt-1">{matter.court}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#EDE8DC]/50 dark:bg-[#12172B] border border-[rgba(184,147,95,0.15)]">
                  <div className="text-[#8A90AC] uppercase font-mono font-semibold text-[11px]">Subject Matter / Land Plot</div>
                  <div className="font-mono font-semibold text-[#B8935F] mt-1">{matter.plot || 'N/A'}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#EDE8DC]/50 dark:bg-[#12172B] border border-[rgba(184,147,95,0.15)]">
                  <div className="text-[#8A90AC] uppercase font-mono font-semibold text-[11px]">Lead Litigation Counsel</div>
                  <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC] mt-1">{matter.leadLawyerName || matter.leadLawyer}</div>
                </div>
              </div>

              {/* Parties Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] pt-2">
                <div className="p-4 rounded-lg bg-[#4F8F6B]/10 border border-[#4F8F6B]/25">
                  <div className="font-bold text-[#4F8F6B] uppercase font-mono text-[11px] mb-1">
                    Claimant(s) / Plaintiff(s)
                  </div>
                  <ul className="list-disc list-inside space-y-1 font-medium text-[#12172B] dark:text-[#F6F3EC]">
                    {matter.plaintiffs.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-[#C1554A]/10 border border-[#C1554A]/25">
                  <div className="font-bold text-[#C1554A] uppercase font-mono text-[11px] mb-1">
                    Defendant(s) / Respondent(s)
                  </div>
                  <ul className="list-disc list-inside space-y-1 font-medium text-[#12172B] dark:text-[#F6F3EC]">
                    {matter.defendants.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Case Summary */}
              <div className="pt-2">
                <div className="font-semibold text-[13px] text-[#12172B] dark:text-[#F6F3EC] mb-1">
                  Summary Notes & Background
                </div>
                <p className="text-[13px] text-[#626A84] dark:text-[#8A90AC] bg-[#EDE8DC]/50 dark:bg-[#12172B] p-3.5 rounded-lg border border-[rgba(184,147,95,0.15)] leading-relaxed">
                  {matter.summaryNotes || 'No summary notes provided for this suit.'}
                </p>
              </div>

            </div>

            {/* Statutory Deadline Analysis Card */}
            <div className="legal-card p-6">
              <h3 className="font-serif font-semibold text-base text-[#12172B] dark:text-[#F6F3EC] mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B8935F]" />
                Statutory Procedural Deadlines
              </h3>
              <p className="text-[13px] text-[#8A90AC] mb-4">
                Calculated windows based on filing date ({matter.filingDate}) and court civil rules ({deadlines.courtType}).
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px] mb-4">
                <div className="p-3 rounded-lg bg-[#EDE8DC]/50 dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]">
                  <div className="text-[11px] text-[#8A90AC] font-mono font-semibold">Claim Due</div>
                  <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC] mt-0.5">{deadlines.statementOfClaimDue}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#EDE8DC]/50 dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]">
                  <div className="text-[11px] text-[#8A90AC] font-mono font-semibold">Defense Due</div>
                  <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC] mt-0.5">{deadlines.defenseDue}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#EDE8DC]/50 dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]">
                  <div className="text-[11px] text-[#8A90AC] font-mono font-semibold">Reply Due</div>
                  <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC] mt-0.5">{deadlines.replyDue}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#EDE8DC]/50 dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]">
                  <div className="text-[11px] text-[#8A90AC] font-mono font-semibold">PTC Window</div>
                  <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC] mt-0.5">{deadlines.preTrialConferenceMaxDate}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-[13px] text-[#626A84] dark:text-[#8A90AC]">
                {deadlines.statutoryNotes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#B8935F] shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Hearing Countdown Box */}
            <div className="p-6 rounded-xl bg-[#1B2140] text-[#F6F3EC] border border-[#B8935F]/40 shadow-lg space-y-3">
              <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#B8935F]">
                Next Court Date
              </div>
              <div className="text-3xl font-serif font-bold text-[#F6F3EC]">
                {matter.nextHearingDate || 'Unscheduled'}
              </div>
              <div className="text-[13px] text-[#8A90AC] flex items-center gap-1.5 font-medium">
                <Gavel className="w-4 h-4 text-[#B8935F]" />
                Purpose: <span className="font-bold text-[#F6F3EC]">{matter.purpose || 'Hearing'}</span>
              </div>
              <div className="pt-2 border-t border-[rgba(184,147,95,0.2)] text-[13px] text-[#8A90AC]">
                Appearances: {matter.appearances || 'To be recorded'}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="legal-card p-5 space-y-3">
              <div className="font-semibold text-[13px] text-[#12172B] dark:text-[#F6F3EC]">Matter Controls</div>
              
              <button
                onClick={() => setActiveTab('timeline')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#EDE8DC] dark:bg-[#12172B] hover:bg-[#E3DDD0] dark:hover:bg-[#1B2140] text-[13px] font-semibold text-[#12172B] dark:text-[#F6F3EC] text-left flex items-center justify-between border border-[rgba(184,147,95,0.2)] transition"
              >
                <span>Log Court Outcome</span>
                <Plus className="w-4 h-4 text-[#B8935F]" />
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#EDE8DC] dark:bg-[#12172B] hover:bg-[#E3DDD0] dark:hover:bg-[#1B2140] text-[13px] font-semibold text-[#12172B] dark:text-[#F6F3EC] text-left flex items-center justify-between border border-[rgba(184,147,95,0.2)] transition"
              >
                <span>Deposit Pleadings / Exhibit</span>
                <Upload className="w-4 h-4 text-[#B8935F]" />
              </button>

              <button
                onClick={() => setActiveTab('reminders')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#EDE8DC] dark:bg-[#12172B] hover:bg-[#E3DDD0] dark:hover:bg-[#1B2140] text-[13px] font-semibold text-[#12172B] dark:text-[#F6F3EC] text-left flex items-center justify-between border border-[rgba(184,147,95,0.2)] transition"
              >
                <span>Schedule Hearing Alert</span>
                <Bell className="w-4 h-4 text-[#B8935F]" />
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
              <h2 className="font-serif font-semibold text-lg text-[#12172B] dark:text-[#F6F3EC]">
                Cause List History & Hearing Outcomes
              </h2>
              <p className="text-[13px] text-[#8A90AC]">
                Chronological record of court sittings, rulings, filings, and adjourning orders.
              </p>
            </div>

            <button
              onClick={() => setShowAddTimeline(!showAddTimeline)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] font-bold text-[13px] transition"
            >
              <Plus className="w-4 h-4" /> Log Court Outcome
            </button>
          </div>

          {/* Log New Timeline Event Form */}
          {showAddTimeline && (
            <form onSubmit={handleAddTimeline} className="legal-card p-5 space-y-4 text-[13px]">
              <div className="font-serif font-semibold text-[#12172B] dark:text-[#F6F3EC] text-base">Log New Court Sitting / Outcome</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Sitting Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as TimelineEvent['type'])}
                    className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)] font-semibold"
                  >
                    <option value="hearing">Hearing Sitting</option>
                    <option value="ruling">Court Ruling</option>
                    <option value="filing">Pleading Filing</option>
                    <option value="note">Internal Case Note</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Sitting Purpose</label>
                  <input
                    type="text"
                    value={eventPurpose}
                    onChange={(e) => setEventPurpose(e.target.value)}
                    placeholder="e.g. Mention, P.T.C, Ruling"
                    className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Appearances Recorded</label>
                <input
                  type="text"
                  value={eventAppearances}
                  onChange={(e) => setEventAppearances(e.target.value)}
                  placeholder="e.g. Chisom Esq. for Claimant, N.O. Egwu Esq. for Defendant"
                  className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Sitting Summary & Proceedings Notes</label>
                <textarea
                  rows={3}
                  required
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  placeholder="Record what transpired in court, witness cross-examination summary, or judge orders..."
                  className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTimeline(false)}
                  className="px-4 py-2 rounded-lg border border-[rgba(184,147,95,0.3)] bg-[#EDE8DC] dark:bg-[#1B2140] text-[#12172B] dark:text-[#F6F3EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#B8935F] text-[#12172B] font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          )}

          {/* Timeline Feed */}
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-[rgba(184,147,95,0.3)]">
            {timeline.length === 0 ? (
              <div className="text-center py-12 text-[#8A90AC] text-[13px]">No timeline events recorded yet.</div>
            ) : (
              timeline.map((item) => (
                <div key={item.id} className="relative pl-10">
                  <div className="absolute left-2 top-3 -translate-x-1/2 w-4 h-4 rounded-full bg-[#B8935F] ring-4 ring-[#F6F3EC] dark:ring-[#12172B]" />
                  
                  <div className="legal-card p-4 space-y-2 text-[13px]">
                    <div className="flex items-center justify-between text-[#8A90AC]">
                      <span className="font-mono font-bold text-[#B8935F]">{item.date}</span>
                      <span className="uppercase font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-[#B8935F]/10 text-[#B8935F] border border-[#B8935F]/20">
                        {item.type}
                      </span>
                    </div>

                    <p className="font-medium text-[#12172B] dark:text-[#F6F3EC] leading-relaxed">
                      {item.summary}
                    </p>

                    {item.appearances && (
                      <div className="text-[13px] text-[#8A90AC] italic bg-[#EDE8DC]/50 dark:bg-[#12172B] p-2 rounded-lg border border-[rgba(184,147,95,0.15)]">
                        Appearances: {item.appearances}
                      </div>
                    )}

                    <div className="text-[11px] text-[#8A90AC]">
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
              <h2 className="font-serif font-semibold text-lg text-[#12172B] dark:text-[#F6F3EC]">
                Document Vault & Exhibits Registry
              </h2>
              <p className="text-[13px] text-[#8A90AC]">
                Indexed repository for court pleadings, sworn affidavits, and trial exhibits.
              </p>
            </div>

            <button
              onClick={() => setShowAddDoc(!showAddDoc)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] font-bold text-[13px] transition"
            >
              <Upload className="w-4 h-4" /> Deposit Document
            </button>
          </div>

          {showAddDoc && (
            <form onSubmit={handleUploadDoc} className="legal-card p-5 space-y-4 text-[13px]">
              <div className="font-serif font-semibold text-[#12172B] dark:text-[#F6F3EC] text-base">Deposit New Court Document</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Document File Name</label>
                  <input
                    type="text"
                    required
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. Motion_for_Interlocutory_Injunction"
                    className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Document Category</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as MatterDocument['docType'])}
                    className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)] font-semibold"
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
                <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Description / Stamp Reference</label>
                <input
                  type="text"
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  placeholder="e.g. Certified True Copy filed at High Court Registry"
                  className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoc(false)}
                  className="px-4 py-2 rounded-lg border border-[rgba(184,147,95,0.3)] bg-[#EDE8DC] dark:bg-[#1B2140] text-[#12172B] dark:text-[#F6F3EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#B8935F] text-[#12172B] font-bold"
                >
                  Deposit Document
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-[#8A90AC] text-[13px]">No documents uploaded.</div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="legal-card p-4 flex items-start justify-between">
                  <div className="space-y-1 text-[13px]">
                    <div className="font-mono font-bold text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#B8935F]" />
                      {doc.fileName}
                    </div>
                    <div className="text-[#8A90AC] text-[13px]">{doc.description || 'No description provided.'}</div>
                    <div className="text-[11px] text-[#8A90AC] flex items-center gap-3 pt-1">
                      <span className="uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#B8935F]/10 text-[#B8935F]">{doc.docType}</span>
                      <span>v{doc.version}</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => showToast('Document Download', `Downloading ${doc.fileName}...`, 'info')}
                    className="px-3 py-1.5 rounded-lg bg-[#EDE8DC] dark:bg-[#12172B] hover:bg-[#B8935F] hover:text-[#12172B] transition text-[13px] font-semibold border border-[rgba(184,147,95,0.25)]"
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
              <h2 className="font-serif font-semibold text-lg text-[#12172B] dark:text-[#F6F3EC]">
                Team Access Control & Permissions
              </h2>
              <p className="text-[13px] text-[#8A90AC]">
                Grant or revoke counsel and paralegal access to suit files.
              </p>
            </div>
          </div>

          <form onSubmit={handleInviteTeam} className="legal-card p-5 space-y-3 text-[13px]">
            <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">Invite Team Member / Co-Counsel</div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@lawfirm.com"
                className="flex-1 p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]"
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)] font-semibold"
              >
                <option value="lawyer">Co-Counsel (Lawyer)</option>
                <option value="paralegal">Paralegal</option>
                <option value="client">Client Viewer (Read Only)</option>
              </select>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#B8935F] text-[#12172B] font-bold"
              >
                Send Invite
              </button>
            </div>
          </form>

          <div className="legal-card p-5 space-y-3">
            <div className="font-semibold text-[13px] text-[#12172B] dark:text-[#F6F3EC]">Authorized Team Members ({matter.teamMembers.length})</div>
            
            <div className="divide-y divide-[rgba(184,147,95,0.15)] text-[13px]">
              {matter.teamMembers.map((uid) => (
                <div key={uid} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#4F8F6B]" />
                    <div>
                      <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">{uid}</div>
                      <div className="text-[11px] text-[#8A90AC]">Granted active access to suit</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#B8935F]/10 text-[#B8935F] border border-[#B8935F]/20">
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
            <h2 className="font-serif font-semibold text-lg text-[#12172B] dark:text-[#F6F3EC]">
              Hearing Alerts & Reminder Schedule
            </h2>
            <p className="text-[13px] text-[#8A90AC]">
              Configure automated hearing date reminders sent via email and in-app feed.
            </p>
          </div>

          <form onSubmit={handleCreateReminder} className="legal-card p-5 space-y-3 text-[13px]">
            <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">Schedule Alert Notification</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Alert Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={remindAtDate}
                  onChange={(e) => setRemindAtDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Notification Message</label>
                <input
                  type="text"
                  required
                  value={remindMsg}
                  onChange={(e) => setRemindMsg(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.2)]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#B8935F] text-[#12172B] font-bold"
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
