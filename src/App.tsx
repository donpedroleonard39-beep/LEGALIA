import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { MattersList } from './components/Matters/MattersList';
import { MatterDetail } from './components/Matters/MatterDetail';
import { MatterFormModal } from './components/Matters/MatterFormModal';
import { DeadlineCalculatorModal } from './components/Matters/DeadlineCalculatorModal';
import { RemindersManager } from './components/Reminders/RemindersManager';
import { NotificationsPage } from './components/Notifications/NotificationsPage';
import { SettingsPage } from './components/Settings/SettingsPage';
import { AuthModal } from './components/Auth/AuthModal';
import { Matter } from './types';
import { fetchAllMatters, fetchInvite, acceptInvite } from './services/matterService';
import { Scale } from 'lucide-react';

// Parses /invite/{matterId}/{inviteId}?token=... from the current URL. There
// is no router in this app (see main.tsx) - this single pattern is handled
// by hand rather than pulling in a routing library for one route.
function parseInviteFromLocation(): { matterId: string; inviteId: string; token: string } | null {
  const match = window.location.pathname.match(/^\/invite\/([^/]+)\/([^/]+)\/?$/);
  if (!match) return null;
  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) return null;
  return { matterId: match[1], inviteId: match[2], token };
}

function AppContent() {
  const { firebaseUser, currentUser, loading: authLoading } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [matters, setMatters] = useState<Matter[]>([]);
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isMatterModalOpen, setIsMatterModalOpen] = useState(false);
  const [matterToEdit, setMatterToEdit] = useState<Matter | null>(null);
  const [isDeadlineCalcOpen, setIsDeadlineCalcOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Invite-link state: if the URL matches /invite/:matterId/:inviteId, we
  // hold onto it until the user is signed in, then accept it once and clean
  // the URL so a refresh doesn't try to re-accept it.
  const [pendingInvite, setPendingInvite] = useState(() => parseInviteFromLocation());
  const [pendingInviteMeta, setPendingInviteMeta] = useState<{ matterTitle?: string; matterSuitNumber?: string } | null>(null);
  const [inviteProcessed, setInviteProcessed] = useState(false);

  useEffect(() => {
    if (firebaseUser && currentUser) {
      loadMatters();
    } else {
      setMatters([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, currentUser]);

  // Look up the invite's matter title/suit number as soon as we know we have
  // a pending invite, so AuthModal can show "You've been invited to X" even
  // before the person signs in.
  useEffect(() => {
    if (!pendingInvite) return;
    fetchInvite(pendingInvite.matterId, pendingInvite.inviteId)
      .then((invite) => {
        if (invite) {
          setPendingInviteMeta({ matterTitle: invite.matterTitle, matterSuitNumber: invite.matterSuitNumber });
        }
      })
      .catch(() => {
        // Invalid/expired invite id - just drop it, no need to surface an
        // error before the person has even signed in.
        setPendingInvite(null);
      });
  }, [pendingInvite]);

  // Once signed in, accept the pending invite (if any) exactly once, then
  // clean the URL and jump straight to the matter.
  useEffect(() => {
    if (!pendingInvite || inviteProcessed || !firebaseUser) return;

    setInviteProcessed(true);
    acceptInvite(pendingInvite.matterId, pendingInvite.inviteId, pendingInvite.token, firebaseUser.uid)
      .then(async (matter) => {
        window.history.replaceState({}, '', '/');
        showToast('Invite accepted', `You now have access to ${matter.suitNumber}.`, 'success');
        await loadMatters();
        setSelectedMatter(matter);
        setActiveTab('matters');
      })
      .catch((err) => {
        window.history.replaceState({}, '', '/');
        showToast('Invite link issue', err?.message || 'This invite link could not be used.', 'error');
      })
      .finally(() => setPendingInvite(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, pendingInvite, inviteProcessed]);

  const loadMatters = async () => {
    if (!firebaseUser || !currentUser) return;
    const list = await fetchAllMatters(firebaseUser.uid);
    setMatters(list);
    // Keep the open matter detail view in sync after an edit/membership
    // change, instead of showing a stale snapshot until the user navigates away.
    setSelectedMatter((prev) => {
      if (!prev) return prev;
      return list.find((m) => m.id === prev.id) || prev;
    });
  };

  const openNewMatterModal = () => {
    setMatterToEdit(null);
    setIsMatterModalOpen(true);
  };

  const openEditMatterModal = (matter: Matter) => {
    setMatterToEdit(matter);
    setIsMatterModalOpen(true);
  };

  // Auth is still resolving - avoid flashing the landing page or an empty
  // shell while Firebase figures out whether there's a session.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
          <Scale className="w-8 h-8 text-[var(--gold)] animate-pulse" />
          <span className="text-[13px] font-medium">Loading Legalia…</span>
        </div>
      </div>
    );
  }

  // Not signed in - only the landing page (and the auth modal) are reachable.
  // The rest of the app, and any Firestore data, stays out of reach until
  // there is a real Firebase Auth session. If there's a pending invite, open
  // the auth modal automatically so the person isn't stuck on the landing
  // page wondering what to do with an /invite link.
  if (!firebaseUser || !currentUser) {
    return (
      <>
        <LandingPage
          isAuthed={false}
          openAuthModal={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen || !!pendingInvite}
          onClose={() => setIsAuthModalOpen(false)}
          pendingInvite={pendingInviteMeta}
        />
      </>
    );
  }

  if (activeTab === 'landing') {
    return (
      <LandingPage
        isAuthed={true}
        setActiveTab={setActiveTab}
        openAuthModal={() => setIsAuthModalOpen(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] font-sans transition-colors duration-200 lg:pl-[76px]">

      {/* Desktop icon rail + mobile bottom tab bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedMatter(null);
        }}
        openNewMatterModal={openNewMatterModal}
        openDeadlineCalcModal={() => setIsDeadlineCalcOpen(true)}
      />

      <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
        {/* Top bar: page title + search */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedMatter(null);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Main Content Area */}
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 lg:p-8 overflow-y-auto">

          {selectedMatter ? (
            <MatterDetail
              matter={selectedMatter}
              onBack={() => setSelectedMatter(null)}
              onRefresh={loadMatters}
              onEdit={openEditMatterModal}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  matters={matters}
                  setActiveTab={setActiveTab}
                  onSelectMatter={setSelectedMatter}
                  openNewMatterModal={openNewMatterModal}
                  openDeadlineCalcModal={() => setIsDeadlineCalcOpen(true)}
                />
              )}

              {activeTab === 'matters' && (
                <MattersList
                  matters={matters}
                  onSelectMatter={setSelectedMatter}
                  openNewMatterModal={openNewMatterModal}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              )}

              {activeTab === 'reminders' && (
                <RemindersManager matters={matters} />
              )}

              {activeTab === 'notifications' && (
                <NotificationsPage
                  onSelectMatter={setSelectedMatter}
                  setActiveTab={setActiveTab}
                  matters={matters}
                />
              )}

              {activeTab === 'settings' && <SettingsPage />}
            </>
          )}

        </main>
      </div>

      {/* Modals */}
      <MatterFormModal
        isOpen={isMatterModalOpen}
        onClose={() => setIsMatterModalOpen(false)}
        matterToEdit={matterToEdit}
        onSaved={loadMatters}
      />

      <DeadlineCalculatorModal
        isOpen={isDeadlineCalcOpen}
        onClose={() => setIsDeadlineCalcOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
