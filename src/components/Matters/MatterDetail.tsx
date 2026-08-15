import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { 
  ArrowLeft, Calendar, Clock, Download, FileText, 
  History, Info, MessageSquare, Plus, Printer, 
  Save, Settings, Share2, ShieldCheck, Trash2, 
  UserPlus, Users, X, AlertCircle, CheckCircle2, Mail, Link2
} from 'lucide-react';
import { Matter, MatterDocument, TimelineEvent, MatterInvite, MatterPermission } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  updateMatterDetails, addTimelineEvent, uploadMatterDocument, 
  deleteMatterDocument, deleteMatterById, generateInviteLink,
  fetchMatterInvites, revokeInvite, setMemberPermission, removeMember,
  fetchUserProfiles
} from '../../services/matterService';
import { generatePrintableBrief } from '../../utils/caseBundleGenerator';
import { DocketStamp } from '../common/DocketStamp';

interface MatterDetailProps {
  matter: Matter;
  onBack: () => void;
  onRefresh: () => void;
  onEdit?: (matter: Matter) => void;
}

type TabType = 'overview' | 'timeline' | 'vault' | 'people' | 'alerts';

export function MatterDetail({ matter, onBack, onRefresh }: MatterDetailProps) {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    const role = matter.members[currentUser.uid];
    return role === 'owner' || role === 'editor';
  }, [matter, currentUser]);

  const isOwner = useMemo(() => {
    return currentUser?.uid === matter.ownerId;
  }, [matter, currentUser]);

  const handleDelete = async () => {
    if (!window.confirm('Are you certain? This will permanently delete this matter and all associated documents.')) return;
    setIsDeleting(true);
    try {
      await deleteMatterById(matter.id);
      showToast('Matter deleted', 'The record has been removed.', 'success');
      onBack();
    } catch (error) {
      showToast('Error', 'Could not delete matter.', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-stack">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="icon-button -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="matter-number">{matter.suitNumber}</span>
            <DocketStamp status={matter.status} size="sm" />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <h1 className="font-serif-title text-[28px] font-semibold leading-tight text-[var(--text-main)]">
              {matter.title}
            </h1>
            <p className="mt-2 text-[13px] text-[var(--text-muted)]">
              {matter.court || 'Court not specified'} · {matter.judge || 'No judge assigned'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button onClick={() => generatePrintableBrief(matter)} className="button-secondary">
              <Printer className="h-4 w-4" /> Print brief
            </button>
            {isOwner && (
              <button onClick={handleDelete} disabled={isDeleting} className="button-secondary text-[var(--alert-red)] hover:bg-[var(--alert-red)]/10">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <nav className="mt-4 flex gap-1 border-b border-[var(--border-subtle)]">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Info className="h-4 w-4" />} label="Brief" />
          <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={<History className="h-4 w-4" />} label="Timeline" />
          <TabButton active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} icon={<FileText className="h-4 w-4" />} label="Vault" />
          <TabButton active={activeTab === 'people'} onClick={() => setActiveTab('people')} icon={<Users className="h-4 w-4" />} label="People" />
          <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon={<Clock className="h-4 w-4" />} label="Alerts" />
        </nav>
      </header>

      {/* Content */}
      <main className="py-2">
        {activeTab === 'overview' && <OverviewPanel matter={matter} canEdit={canEdit} />}
        {activeTab === 'timeline' && <TimelinePanel matter={matter} canEdit={canEdit} onRefresh={onRefresh} />}
        {activeTab === 'vault' && <VaultPanel matter={matter} canEdit={canEdit} onRefresh={onRefresh} />}
        {activeTab === 'people' && <PeoplePanel matter={matter} isOwner={isOwner} onRefresh={onRefresh} />}
        {activeTab === 'alerts' && <AlertsPanel matter={matter} canEdit={canEdit} onRefresh={onRefresh} />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium transition ${
        active 
          ? 'border-[var(--gold)] text-[var(--gold)]' 
          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function OverviewPanel({ matter, canEdit }: { matter: Matter; canEdit: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <section className="panel-card">
          <div className="panel-heading"><h2 className="section-title">Case details</h2></div>
          <div className="grid gap-6 sm:grid-cols-2">
            <InfoField label="Suit number" value={matter.suitNumber} mono />
            <InfoField label="Court" value={matter.court || 'Not specified'} />
            <InfoField label="Judge" value={matter.judge || 'Not assigned'} />
            <InfoField label="Plot / Subject" value={matter.plot || 'None'} mono />
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <p className="eyebrow mb-2">Claimant / Plaintiff</p>
              <div className="flex flex-wrap gap-2">
                {matter.plaintiffs.map(p => <span key={p} className="badge badge-green">{p}</span>)}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-2">Respondent / Defendant</p>
              <div className="flex flex-wrap gap-2">
                {matter.defendants.map(d => <span key={d} className="badge badge-red">{d}</span>)}
              </div>
            </div>
          </div>
        </section>

        {matter.summaryNotes && (
          <section className="panel-card">
            <div className="panel-heading"><h2 className="section-title">Summary notes</h2></div>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-main)]">
              {matter.summaryNotes}
            </p>
          </section>
        )}
      </div>

      <div className="space-y-6">
        <section className="panel-card bg-[var(--gold-soft)]/20 border-[var(--gold)]/30">
          <div className="panel-heading"><h2 className="section-title text-[var(--gold)]">Next appearance</h2></div>
          {matter.nextHearingDate ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[var(--text-main)]">
                <Calendar className="h-5 w-5 text-[var(--gold)]" />
                <span className="text-[18px] font-semibold">{new Date(matter.nextHearingDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <Clock className="h-5 w-5" />
                <span className="text-[14px]">{matter.purpose || 'Appearance'}</span>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-muted)] italic">No upcoming hearing scheduled.</p>
          )}
        </section>

        <section className="panel-card">
          <div className="panel-heading"><h2 className="section-title">Matter access</h2></div>
          <div className="flex items-center gap-3 rounded-lg bg-[var(--bg-base)] p-3">
            <ShieldCheck className="h-5 w-5 text-[var(--gold)]" />
            <div>
              <p className="text-[12px] font-semibold text-[var(--text-main)]">Private workspace</p>
              <p className="text-[11px] text-[var(--text-muted)]">Only members can view this record.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="eyebrow mb-1">{label}</p>
      <p className={`text-[14px] font-medium text-[var(--text-main)] ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function TimelinePanel({ matter, canEdit, onRefresh }: { matter: Matter; canEdit: boolean; onRefresh: () => void }) {
  return (
    <div className="panel-card">
      <div className="panel-heading">
        <h2 className="section-title">Procedural history</h2>
        {canEdit && <button className="button-secondary text-[12px]"><Plus className="h-3.5 w-3.5" /> Add event</button>}
      </div>
      <div className="py-8 text-center">
        <History className="mx-auto h-12 w-12 text-[var(--border-subtle)]" />
        <p className="mt-4 text-[13px] text-[var(--text-muted)]">Timeline history is coming soon.</p>
      </div>
    </div>
  );
}

function VaultPanel({ matter, canEdit, onRefresh }: { matter: Matter; canEdit: boolean; onRefresh: () => void }) {
  return (
    <div className="panel-card">
      <div className="panel-heading">
        <h2 className="section-title">Document vault</h2>
      </div>
      <div className="py-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-[var(--border-subtle)]" />
        <p className="mt-4 text-[13px] text-[var(--text-muted)]">Document storage is coming soon.</p>
      </div>
    </div>
  );
}

function PeoplePanel({ matter, isOwner, onRefresh }: { matter: Matter; isOwner: boolean; onRefresh: () => void }) {
  const { showToast } = useNotifications();
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitePermission, setInvitePermission] = useState<Exclude<MatterPermission, 'owner'>>('editor');
  const [invites, setInvites] = useState<MatterInvite[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; email: string }>>({});
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const memberUids = useMemo(() => Object.keys(matter.members), [matter.members]);

  useEffect(() => {
    fetchUserProfiles(memberUids).then(setProfiles).catch(() => {});
    if (isOwner) {
      fetchMatterInvites(matter.id).then(setInvites).catch(() => {});
    }
  }, [matter.id, memberUids, isOwner]);

  const pendingInvites = invites.filter((invite) => invite.status === 'pending');

  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      const link = await generateInviteLink(matter.id, invitePermission);
      await navigator.clipboard.writeText(link);
      showToast('Link copied', `Invite link (${invitePermission}) copied to clipboard.`, 'success');
      if (isOwner) fetchMatterInvites(matter.id).then(setInvites).catch(() => {});
    } catch (err) {
      showToast('Error', 'Could not generate invite.', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handlePermissionChange = async (uid: string, permission: Exclude<MatterPermission, 'owner'>) => {
    setBusyUid(uid);
    try {
      await setMemberPermission(matter, uid, permission);
      showToast('Access updated', 'Member permission changed.', 'success');
      onRefresh();
    } catch (err: any) {
      showToast('Error', err?.message || 'Could not update permission.', 'error');
    } finally {
      setBusyUid(null);
    }
  };

  const handleRemove = async (uid: string) => {
    if (!window.confirm('Remove this person from the matter? They will lose all access.')) return;
    setBusyUid(uid);
    try {
      await removeMember(matter, uid);
      showToast('Member removed', 'Their access to this matter has been revoked.', 'success');
      onRefresh();
    } catch (err: any) {
      showToast('Error', err?.message || 'Could not remove member.', 'error');
    } finally {
      setBusyUid(null);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    setBusyInviteId(inviteId);
    try {
      await revokeInvite(matter.id, inviteId);
      setInvites((current) => current.filter((invite) => invite.id !== inviteId));
      showToast('Invite revoked', 'That invite link no longer works.', 'success');
    } catch (err) {
      showToast('Error', 'Could not revoke invite.', 'error');
    } finally {
      setBusyInviteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel-card">
        <div className="panel-heading">
          <h2 className="section-title">Collaborators</h2>
          {isOwner && (
            <div className="flex items-center gap-2">
              <select
                value={invitePermission}
                onChange={(event) => setInvitePermission(event.target.value as Exclude<MatterPermission, 'owner'>)}
                className="field-control text-[12px] !py-1.5"
                aria-label="Permission for new invite"
              >
                <option value="editor">Can edit</option>
                <option value="viewer">Can view</option>
              </select>
              <button onClick={handleInvite} disabled={inviteLoading} className="button-secondary text-[12px]">
                <UserPlus className="h-3.5 w-3.5" /> {inviteLoading ? 'Generating…' : 'Invite'}
              </button>
            </div>
          )}
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {memberUids.map((uid) => {
            const profile = profiles[uid];
            const role = matter.members[uid];
            const isSelf = uid === matter.ownerId;
            return (
              <div key={uid} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--gold)] font-bold text-[12px]">
                    {(isSelf ? matter.ownerName : profile?.name)?.charAt(0).toUpperCase() || '·'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[var(--text-main)]">
                      {isSelf ? matter.ownerName || 'Owner' : profile?.name || 'Loading…'}
                    </p>
                    <p className="truncate text-[11px] text-[var(--text-muted)]">{profile?.email || ''}</p>
                  </div>
                </div>

                {isOwner && !isSelf ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <select
                      value={role}
                      disabled={busyUid === uid}
                      onChange={(event) => handlePermissionChange(uid, event.target.value as Exclude<MatterPermission, 'owner'>)}
                      className="field-control text-[11px] !py-1"
                    >
                      <option value="editor">Can edit</option>
                      <option value="viewer">Can view</option>
                    </select>
                    <button
                      onClick={() => handleRemove(uid)}
                      disabled={busyUid === uid}
                      className="icon-button danger"
                      aria-label="Remove member"
                      title="Remove member"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="shrink-0 text-[11px] capitalize text-[var(--text-muted)]">{role}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isOwner && pendingInvites.length > 0 && (
        <div className="panel-card">
          <div className="panel-heading">
            <h2 className="section-title">Pending invites</h2>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-base)] text-[var(--text-muted)]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[var(--text-main)]">Unclaimed invite link</p>
                    <p className="text-[11px] capitalize text-[var(--text-muted)]">{invite.permission} access · created {new Date(invite.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(invite.id)}
                  disabled={busyInviteId === invite.id}
                  className="button-secondary text-[11px]"
                >
                  <Link2 className="h-3.5 w-3.5" /> Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertsPanel({ matter, canEdit, onRefresh }: { matter: Matter; canEdit: boolean; onRefresh: () => void }) {
  return (
    <div className="panel-card">
      <div className="panel-heading">
        <h2 className="section-title">Reminders & alerts</h2>
      </div>
      <div className="py-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-[var(--border-subtle)]" />
        <p className="mt-4 text-[13px] text-[var(--text-muted)]">Set specific alerts for this matter here.</p>
      </div>
    </div>
  );
}
