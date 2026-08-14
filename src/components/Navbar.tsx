import { Search, Shield } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const navLabels: Record<string, string> = {
  dashboard: 'Workspace',
  matters: 'Matter register',
  reminders: 'Hearing diary',
  notifications: 'Notifications',
  settings: 'Preferences',
};

export function Navbar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] w-full max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="group flex shrink-0 items-center gap-3 text-left lg:hidden"
          aria-label="Go to Legalia workspace"
        >
          <span className="brand-mark"><Shield className="h-[18px] w-[18px]" /></span>
        </button>

        <div className="hidden min-w-0 lg:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Current desk</p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-[var(--text-main)]">{navLabels[activeTab] || 'Workspace'}</p>
        </div>

        <div className="hidden h-8 w-px bg-[var(--border-subtle)] lg:block" />

        <div className="relative ml-auto w-full max-w-[420px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search matters, parties, judges…"
            className="field-control w-full pl-10"
            aria-label="Search matters"
          />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
