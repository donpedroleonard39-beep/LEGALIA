import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Lock, CheckCircle2, XCircle, Mail, Gavel } from 'lucide-react';
import { Matter, UserProfile, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  fetchAllUsers,
  updateUserRole,
  addTeamMemberToMatter,
  removeTeamMemberFromMatter,
} from '../../services/matterService';

interface TeamManagerProps {
  matters: Matter[];
  onMattersChanged: () => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  lawyer: 'Lawyer',
  paralegal: 'Paralegal',
  client: 'Client',
};

export const TeamManager: React.FC<TeamManagerProps> = ({ matters, onMattersChanged }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const list = await fetchAllUsers();
      list.sort((a, b) => a.name.localeCompare(b.name));
      setStaff(list);
      if (!selectedUid && list.length > 0) setSelectedUid(list[0].uid);
    } catch (err) {
      console.warn('Could not load practice roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    if (!isAdmin) return;
    try {
      await updateUserRole(uid, role);
      setStaff((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
      showToast('Role Updated', 'Practice role updated successfully.', 'success');
    } catch (err: any) {
      showToast('Update Failed', err?.message || 'Could not update role.', 'error');
    }
  };

  const toggleMatterAccess = async (matter: Matter, uid: string, hasAccess: boolean) => {
    if (!isAdmin) return;
    try {
      if (hasAccess) {
        await removeTeamMemberFromMatter(matter.id, uid);
      } else {
        await addTeamMemberToMatter(matter.id, uid);
      }
      onMattersChanged();
    } catch (err: any) {
      showToast('Update Failed', err?.message || 'Could not update matter access.', 'error');
    }
  };

  const selected = staff.find((u) => u.uid === selectedUid) || null;

  return (
    <div className="space-y-6 text-[13px]">

      <div className="legal-card p-6 flex items-center gap-3">
        <div className="icon-box-32">
          <Users className="w-4 h-4 text-[#B8935F]" />
        </div>
        <div>
          <h1 className="font-serif font-semibold text-2xl text-[#12172B] dark:text-[#F6F3EC]">
            Team & Access
          </h1>
          <p className="text-[13px] text-[#8A90AC]">
            Practice personnel roster, roles, and per-suit matter access.
          </p>
        </div>
      </div>

      {!isAdmin && (
        <div className="legal-card p-4 flex items-center gap-2 text-[#8A90AC]">
          <Lock className="w-4 h-4 text-[#B8935F]" />
          Read-only view. Only a practice admin can change roles or matter access here -
          lead lawyers can still add colleagues to a specific suit from that suit's Team tab.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Roster List */}
        <div className="legal-card p-5 space-y-2">
          <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC] mb-2">
            Registered Accounts ({staff.length})
          </div>

          {loading ? (
            <div className="text-center py-8 text-[#8A90AC]">Loading roster…</div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-[#8A90AC]">No accounts registered yet.</div>
          ) : (
            <div className="divide-y divide-[rgba(184,147,95,0.15)]">
              {staff.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => setSelectedUid(u.uid)}
                  className={`w-full text-left py-3 px-2 rounded-lg transition ${
                    selectedUid === u.uid
                      ? 'bg-[#B8935F]/10 border border-[#B8935F]/30'
                      : 'hover:bg-[#EDE8DC] dark:hover:bg-[#12172B]/40 border border-transparent'
                  }`}
                >
                  <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">{u.name}</div>
                  <div className="text-[11px] text-[#8A90AC] flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3" /> {u.email}
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#B8935F]/10 text-[#B8935F]">
                    {ROLE_LABEL[u.role]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Member Detail */}
        <div className="lg:col-span-2 space-y-6">
          {selected ? (
            <>
              <div className="legal-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif font-semibold text-lg text-[#12172B] dark:text-[#F6F3EC]">
                      {selected.name}
                    </div>
                    <div className="text-[13px] text-[#8A90AC]">{selected.email}</div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[#B8935F]" />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Practice Role</label>
                  <select
                    value={selected.role}
                    disabled={!isAdmin || selected.uid === currentUser?.uid}
                    onChange={(e) => handleRoleChange(selected.uid, e.target.value as UserRole)}
                    className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] font-semibold disabled:opacity-60"
                  >
                    <option value="admin">Admin (full practice access)</option>
                    <option value="lawyer">Lawyer (firm-wide matter visibility)</option>
                    <option value="paralegal">Paralegal (firm-wide matter visibility)</option>
                    <option value="client">Client (only assigned suits)</option>
                  </select>
                  {selected.uid === currentUser?.uid && (
                    <p className="text-[11px] text-[#8A90AC] mt-1">You can't change your own role.</p>
                  )}
                  {!selected.title && (
                    <p className="text-[11px] text-[#8A90AC] mt-1">
                      Admin, Lawyer, and Paralegal roles see the full matter registry (needed for conflict-of-interest
                      checks). Client accounts only ever see suits they're explicitly added to below.
                    </p>
                  )}
                </div>
              </div>

              <div className="legal-card p-5 space-y-3">
                <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-[#B8935F]" />
                  Suit Access ({matters.filter((m) => m.teamMembers.includes(selected.uid)).length} of {matters.length})
                </div>

                {matters.length === 0 ? (
                  <div className="text-center py-8 text-[#8A90AC]">No matters in the registry yet.</div>
                ) : (
                  <div className="divide-y divide-[rgba(184,147,95,0.15)]">
                    {matters.map((m) => {
                      const hasAccess = m.teamMembers.includes(selected.uid);
                      return (
                        <div key={m.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-mono font-bold text-[#B8935F]">{m.suitNumber}</div>
                            <div className="text-[12px] text-[#8A90AC] truncate max-w-xs">{m.title}</div>
                          </div>
                          <button
                            disabled={!isAdmin}
                            onClick={() => toggleMatterAccess(m, selected.uid, hasAccess)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                              hasAccess
                                ? 'bg-[#4F8F6B]/10 text-[#4F8F6B] border border-[#4F8F6B]/30'
                                : 'bg-[#EDE8DC] dark:bg-[#12172B] text-[#8A90AC] border border-[rgba(184,147,95,0.2)]'
                            }`}
                          >
                            {hasAccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {hasAccess ? 'Has Access' : 'No Access'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="legal-card p-10 text-center text-[#8A90AC]">
              Select a team member to view their access.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
