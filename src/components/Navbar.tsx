import { useEffect, useRef, useState } from 'react';
import { Calculator, Gavel, LogOut, Moon, Search, Settings, Sun, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PAGES, initials, type PageId } from './navConfig';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openDeadlineCalcModal: () => void;
}

export function Navbar({ activeTab, setActiveTab, searchQuery, setSearchQuery, openDeadlineCalcModal }: NavbarProps) {
  const { currentUser, logout } = useAuth();
  const { setTheme, isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const page = PAGES[activeTab as PageId] || PAGES.dashboard;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const go = (tab: string) => { setActiveTab(tab); setMenuOpen(false); };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button onClick={() => setActiveTab('dashboard')} className="flex shrink-0 items-center lg:hidden" aria-label="Legalia home">
          <span className="brand-mark"><Gavel className="h-[18px] w-[18px]" /></span>
        </button>

        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-[16px] font-semibold text-[var(--text-main)]">{page.label}</p>
          <p className="truncate text-[12px] text-[var(--text-muted)]">{page.description}</p>
        </div>

        {/* Matters has its own search bar, so the top bar only shows one elsewhere.
            Typing here jumps straight to Matters with the results filtered. */}
        {activeTab !== 'matters' ? (
          <div className="relative ml-auto w-full max-w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                if (event.target.value.trim()) setActiveTab('matters');
              }}
              placeholder="Search suit no., party, judge…"
              className="field-control w-full pl-10"
              aria-label="Search matters"
            />
          </div>
        ) : <div className="ml-auto" />}

        {/* Account menu - on desktop the sidebar has these, phones need them here */}
        <div ref={menuRef} className="relative lg:hidden">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex" aria-label="Account menu" aria-expanded={menuOpen}>
            <span className="avatar">{initials(currentUser?.name)}</span>
          </button>
          {menuOpen && (
            <div className="popover-panel right-0 top-full mt-2 w-[240px] p-2">
              <div className="mb-1 rounded-xl bg-[var(--bg-base)] p-3">
                <p className="truncate text-[13px] font-semibold">{currentUser?.name}</p>
                <p className="truncate text-[12px] text-[var(--text-muted)]">{currentUser?.email}</p>
              </div>
              <button className="menu-item" onClick={() => go('collaborators')}><Users className="h-4 w-4" /> People</button>
              <button className="menu-item" onClick={() => { openDeadlineCalcModal(); setMenuOpen(false); }}><Calculator className="h-4 w-4" /> Deadline calculator</button>
              <button className="menu-item" onClick={() => go('settings')}><Settings className="h-4 w-4" /> Settings</button>
              <button className="menu-item" onClick={() => setTheme(isDark ? 'light' : 'dark')}>{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {isDark ? 'Light mode' : 'Dark mode'}</button>
              <div className="my-1 border-t border-[var(--border-subtle)]" />
              <button className="menu-item text-[var(--alert-red)]" onClick={() => void logout()}><LogOut className="h-4 w-4" /> Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
