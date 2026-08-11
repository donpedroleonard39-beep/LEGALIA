import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { MattersList } from './components/Matters/MattersList';
import { MatterDetail } from './components/Matters/MatterDetail';
import { MatterFormModal } from './components/Matters/MatterFormModal';
import { ConflictChecker } from './components/Matters/ConflictChecker';
import { DeadlineCalculatorModal } from './components/Matters/DeadlineCalculatorModal';
import { RemindersManager } from './components/Reminders/RemindersManager';
import { NotificationsPage } from './components/Notifications/NotificationsPage';
import { TeamManager } from './components/Team/TeamManager';
import { SettingsPage } from './components/Settings/SettingsPage';
import { AuthModal } from './components/Auth/AuthModal';
import { Matter } from './types';
import { fetchAllMatters } from './services/matterService';
import { Scale } from 'lucide-react';

function AppContent() {
  const { firebaseUser, currentUser, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [matters, setMatters] = useState<Matter[]>([]);
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isMatterModalOpen, setIsMatterModalOpen] = useState(false);
  const [matterToEdit, setMatterToEdit] = useState<Matter | null>(null);
  const [isDeadlineCalcOpen, setIsDeadlineCalcOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isInternalStaff = currentUser?.role === 'admin' || currentUser?.role === 'lawyer' || currentUser?.role === 'paralegal';

  useEffect(() => {
    if (firebaseUser && currentUser) {
      loadMatters();
    } else {
      setMatters([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, currentUser?.role]);

  const loadMatters = async () => {
    if (!firebaseUser || !currentUser) return;
    const list = await fetchAllMatters(firebaseUser.uid, isInternalStaff);
    setMatters(list);
    // Keep the open matter detail view in sync after an edit/team change,
    // instead of showing a stale snapshot until the user navigates away.
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2EA] dark:bg-[#12172B]">
        <div className="flex flex-col items-center gap-3 text-[#8A90AC]">
          <Scale className="w-8 h-8 text-[#B8935F] animate-pulse" />
          <span className="text-[13px] font-medium">Loading LEGALIA…</span>
        </div>
      </div>
    );
  }

  // Not signed in - only the landing page (and the auth modal) are reachable.
  // The rest of the app, and any Firestore data, stays out of reach until
  // there is a real Firebase Auth session.
  if (!firebaseUser || !currentUser) {
    return (
      <>
        <LandingPage
          isAuthed={false}
          openAuthModal={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
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
    <div className="min-h-screen flex flex-col bg-[#F5F2EA] dark:bg-[#12172B] text-[#12172B] dark:text-[#F6F3EC] font-sans transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedMatter(null);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedMatter(null);
          }}
          openNewMatterModal={openNewMatterModal}
          openDeadlineCalcModal={() => setIsDeadlineCalcOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          
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

              {activeTab === 'conflict' && (
                <ConflictChecker
                  matters={matters}
                  onSelectMatter={setSelectedMatter}
                  setActiveTab={setActiveTab}
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

              {activeTab === 'team' && (
                <TeamManager matters={matters} onMattersChanged={loadMatters} />
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
