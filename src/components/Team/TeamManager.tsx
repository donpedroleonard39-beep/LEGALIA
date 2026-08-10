import React, { useState } from 'react';
import { Users, ShieldCheck, Lock, CheckCircle2, XCircle, Plus, Mail } from 'lucide-react';
import { Matter, UserProfile, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const INITIAL_CHAMBERS_TEAM: UserProfile[] = [
  {
    uid: 'counsel_principal',
    name: 'Barr. Chisom Okeke',
    email: 'chisom.okeke@legalia-chambers.org',
    role: 'admin',
    matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023', 'matter_e569_2022', 'matter_e104_2024'],
    notifyPrefs: { email: true, inApp: true, dailyDigest: true },
    theme: 'light',
    title: 'Principal Counsel',
    organization: 'Legalia Chambers',
  },
  {
    uid: 'lawyer_associate',
    name: 'Barr. Nnamdi Egwu',
    email: 'nnamdi.egwu@legalia-chambers.org',
    role: 'lawyer',
    matterAccess: ['matter_e968_2022', 'matter_e779_2021', 'matter_e357_2023'],
    notifyPrefs: { email: true, inApp: true, dailyDigest: true },
    theme: 'light',
    title: 'Senior Associate Counsel',
    organization: 'Legalia Chambers',
  },
  {
    uid: 'paralegal_lead',
    name: 'Joy Amadi',
    email: 'joy.amadi@legalia-chambers.org',
    role: 'paralegal',
    matterAccess: ['matter_e968_2022', 'matter_e779_2021'],
    notifyPrefs: { email: false, inApp: true, dailyDigest: false },
    theme: 'light',
    title: 'Head Paralegal',
    organization: 'Legalia Chambers',
  },
];

interface TeamManagerProps {
  matters: Matter[];
}

export const TeamManager: React.FC<TeamManagerProps> = ({ matters }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [usersList, setUsersList] = useState<UserProfile[]>(INITIAL_CHAMBERS_TEAM);
  const [selectedUserUid, setSelectedUserUid] = useState<string>(usersList[0]?.uid || '');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('lawyer');

  const selectedUser = usersList.find((u) => u.uid === selectedUserUid);

  const toggleMatterAccess = (matterId: string) => {
    if (!selectedUser) return;

    const exists = selectedUser.matterAccess.includes(matterId);
    let updatedAccess = [];

    if (exists) {
      updatedAccess = selectedUser.matterAccess.filter((id) => id !== matterId);
    } else {
      updatedAccess = [...selectedUser.matterAccess, matterId];
    }

    setUsersList((prev) =>
      prev.map((u) => (u.uid === selectedUser.uid ? { ...u, matterAccess: updatedAccess } : u))
    );

    showToast('Access Updated', `Matter access modified for ${selectedUser.name}.`, 'info');
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newUser: UserProfile = {
      uid: `user_${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      matterAccess: [matters[0]?.id].filter(Boolean),
      notifyPrefs: { email: true, inApp: true, dailyDigest: true },
      theme: 'light',
      organization: 'Chisom & Partners',
    };

    setUsersList((prev) => [...prev, newUser]);
    showToast('Invite Dispatched', `Access invite sent to ${inviteEmail}.`, 'success');
    setInviteEmail('');
  };

  return (
    <div className="space-y-6 text-[13px]">
      
      {/* Header */}
      <div className="legal-card p-6">
        <div className="flex items-center gap-3">
          <div className="icon-box-32">
            <Users className="w-4 h-4 text-[#B8935F]" />
          </div>
          <div>
            <h1 className="font-serif font-semibold text-2xl text-[#12172B] dark:text-[#F6F3EC]">
              Team & Granular Access Control
            </h1>
            <p className="text-[13px] text-[#8A90AC]">
              Admin management panel: Assign counsel roles and toggle per-matter suit access.
            </p>
          </div>
        </div>
      </div>

      {/* Invite Box */}
      <form onSubmit={handleSendInvite} className="legal-card p-5 space-y-3">
        <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">Invite New Firm Counsel / Paralegal</div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@lawfirm.com"
            className="flex-1 p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] text-[#12172B] dark:text-[#F6F3EC] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
          />

          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
            className="p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] font-bold text-[#12172B] dark:text-[#F6F3EC] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
          >
            <option value="admin">Managing Partner (Admin)</option>
            <option value="lawyer">Lead Counsel (Lawyer)</option>
            <option value="paralegal">Paralegal</option>
            <option value="client">Client Viewer</option>
          </select>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] font-bold transition shadow-sm"
          >
            Send Invite
          </button>
        </div>
      </form>

      {/* User Selector & Access Toggle Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User List Column */}
        <div className="legal-card p-5 space-y-3">
          <div className="font-semibold text-xs uppercase text-[#8A90AC]">Firm Personnel</div>
          
          <div className="space-y-2">
            {usersList.map((u) => (
              <button
                key={u.uid}
                onClick={() => setSelectedUserUid(u.uid)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedUserUid === u.uid
                    ? 'bg-[#B8935F]/15 border-[#B8935F] text-[#12172B] dark:text-[#F6F3EC] font-semibold'
                    : 'bg-[#EDE8DC] dark:bg-[#12172B]/50 border-[rgba(184,147,95,0.15)] text-[#12172B] dark:text-[#8A90AC]'
                }`}
              >
                <div className="font-semibold">{u.name}</div>
                <div className="text-[13px] text-[#8A90AC] capitalize">{u.role} &bull; {u.email}</div>
                <div className="text-[13px] text-[#B8935F] font-semibold mt-1">
                  Access: {u.matterAccess.length} Suit(s)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Access Matrix Column */}
        {selectedUser && (
          <div className="lg:col-span-2 legal-card p-6 space-y-4">
            <div className="border-b border-[rgba(184,147,95,0.2)] pb-3">
              <div className="font-semibold text-sm text-[#12172B] dark:text-[#F6F3EC]">
                Granted Suits for {selectedUser.name} ({selectedUser.role.toUpperCase()})
              </div>
              <div className="text-[#8A90AC] text-[13px]">
                Toggle access switches to grant or revoke suit visibility.
              </div>
            </div>

            <div className="divide-y divide-[rgba(184,147,95,0.15)]">
              {matters.map((m) => {
                const hasAccess = selectedUser.matterAccess.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-[#B8935F]">
                        {m.suitNumber}
                      </div>
                      <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">
                        {m.title}
                      </div>
                      <div className="text-[13px] text-[#8A90AC]">
                        Judge: {m.judge} &bull; Plot: {m.plot || 'N/A'}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleMatterAccess(m.id)}
                      className={`px-4 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        hasAccess
                          ? 'bg-[#4F8F6B]/15 text-[#4F8F6B] border border-[#4F8F6B]/30'
                          : 'bg-[#EDE8DC] dark:bg-[#12172B] text-[#8A90AC] border border-[rgba(184,147,95,0.2)]'
                      }`}
                    >
                      {hasAccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Granted
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Revoked
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
