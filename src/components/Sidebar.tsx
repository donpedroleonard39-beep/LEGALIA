import type { ReactNode } from 'react';
import { Bell, CalendarClock, Gavel, LayoutDashboard, Plus, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openNewMatterModal: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Workspace', caption: 'Your daily desk', icon: LayoutDashboard },
  { id: 'matters', label: 'Matter register', caption: 'Private proceedings', icon: Gavel },
  { id: 'reminders', label: 'Hearing diary', caption: 'Dates & alerts', icon: CalendarClock },
  { id: 'notifications', label: 'Notifications', caption: 'Matter activity', icon: Bell }
];

export function Sidebar({ activeTab, setActiveTab, openNewMatterModal }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-[230px] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-5 lg:flex">
        <div className="mb-5 px-3">
          <p className="eyebrow">Practice desk</p>
          <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">
            A clear place for the work that follows you into court.
          </p>
        </div>

        <button onClick={openNewMatterModal} className="button-primary mb-5 w-full">
          <Plus className="h-4 w-4" /> Open a matter
        </button>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                  active
                    ? 'bg-[var(--gold-soft)] text-[var(--gold)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-main)]'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="min-w-0">
                  <span className={`block text-[12px] font-semibold ${active ? 'text-[var(--gold)]' : 'text-[var(--text-main)]'}`}>
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] opacity-75">
                    {item.caption}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3">
          <ShieldCheck className="h-4 w-4 text-[var(--gold)]" />
          <p className="mt-2 text-[11px] font-semibold text-[var(--text-main)]">
            Matter-specific access
          </p>
          <p className="mt-1 text-[10px] leading-4 text-[var(--text-muted)]">
            People see only the matters they belong to.
          </p>
        </div>
      </aside>

      <nav className="bottom-tab-bar lg:hidden">
        <div className="grid grid-cols-5 items-end px-1 py-1.5">
          <MobileTab
            id="dashboard"
            label="Home"
            icon={<LayoutDashboard />}
            activeTab={activeTab}
            onClick={() => setActiveTab('dashboard')}
          />
          <MobileTab
            id="matters"
            label="Matters"
            icon={<Gavel />}
            activeTab={activeTab}
            onClick={() => setActiveTab('matters')}
          />
          <button onClick={openNewMatterModal} className="flex flex-col items-center justify-center">
            <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[var(--bg-base)] bg-[var(--gold)] text-[var(--ink-raised)] shadow-lg">
              <Plus className="h-6 w-6" />
            </span>
            <span className="mt-1 text-[10px] font-semibold text-[var(--text-muted)]">New</span>
          </button>
          <MobileTab
            id="reminders"
            label="Diary"
            icon={<CalendarClock />}
            activeTab={activeTab}
            onClick={() => setActiveTab('reminders')}
          />
          <MobileTab
            id="notifications"
            label="Alerts"
            icon={<Bell />}
            activeTab={activeTab}
            onClick={() => setActiveTab('notifications')}
          />
        </div>
      </nav>
    </>
  );
}

function MobileTab({ id, label, icon, activeTab, onClick }: { id: string; label: string; icon: ReactNode; activeTab: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`bottom-tab-item ${activeTab === id ? 'active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default Sidebar;
