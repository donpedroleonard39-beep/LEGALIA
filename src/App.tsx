import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
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

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [matters, setMatters] = useState<Matter[]>([]);
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isMatterModalOpen, setIsMatterModalOpen] = useState(false);
  const [matterToEdit, setMatterToEdit] = useState<Matter | null>(null);
  const [isDeadlineCalcOpen, setIsDeadlineCalcOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    loadMatters();
  }, []);

  const loadMatters = async () => {
    const list = await fetchAllMatters();
    setMatters(list);
  };

  const openNewMatterModal = () => {
    setMatterToEdit(null);
    setIsMatterModalOpen(true);
  };

  if (activeTab === 'landing') {
    return (
      <LandingPage
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
                <TeamManager matters={matters} />
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
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
