import React, { useState } from 'react';
import { Users, ShieldCheck, Lock, CheckCircle2, XCircle, Plus, Mail } from 'lucide-react';
import { Matter, UserProfile, UserRole } from '../../types';
import { DEMO_USERS, useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface TeamManagerProps {
  matters: Matter[];
}

export const TeamManager: React.FC<TeamManagerProps> = ({ matters }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [usersList, setUsersList] = useState<UserProfile[]>(Object.values(DEMO_USERS));
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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100">
              Team & Granular Access Control
            </h1>
            <p className="text-xs text-slate-500">
              Admin management panel: Assign counsel roles and toggle per-matter suit access.
            </p>
          </div>
        </div>
      </div>

      {/* Invite Box */}
      <form onSubmit={handleSendInvite} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
        <div className="font-bold text-slate-900 dark:text-slate-100">Invite New Firm Counsel / Paralegal</div>
        
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
            <option value="admin">Managing Partner (Admin)</option>
            <option value="lawyer">Lead Counsel (Lawyer)</option>
            <option value="paralegal">Paralegal</option>
            <option value="client">Client Viewer</option>
          </select>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition"
          >
            Send Invite
          </button>
        </div>
      </form>

      {/* User Selector & Access Toggle Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User List Column */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="font-bold text-xs uppercase text-slate-400">Firm Personnel</div>
          
          <div className="space-y-2 text-xs">
            {usersList.map((u) => (
              <button
                key={u.uid}
                onClick={() => setSelectedUserUid(u.uid)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  selectedUserUid === u.uid
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold">{u.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{u.role} &bull; {u.email}</div>
                <div className="text-[10px] text-amber-600 font-bold mt-1">
                  Access: {u.matterAccess.length} Suit(s)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Access Matrix Column */}
        {selectedUser && (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Granted Suits for {selectedUser.name} ({selectedUser.role.toUpperCase()})
              </div>
              <div className="text-slate-400 text-xs">
                Toggle access switches to grant or revoke suit visibility.
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {matters.map((m) => {
                const hasAccess = selectedUser.matterAccess.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {m.suitNumber}
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {m.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Judge: {m.judge} &bull; Plot: {m.plot || 'N/A'}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleMatterAccess(m.id)}
                      className={`px-4 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                        hasAccess
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
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
