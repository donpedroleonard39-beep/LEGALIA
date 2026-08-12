import { useMemo, type ReactNode } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FolderOpen,
  Gavel,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Matter } from '../types';
import { DocketStamp } from './common/DocketStamp';

interface DashboardProps {
  matters: Matter[];
  setActiveTab: (tab: string) => void;
  onSelectMatter: (matter: Matter) => void;
  openNewMatterModal: () => void;
  openDeadlineCalcModal: () => void;
}

function displayDate(value?: string) {
  if (!value) return 'Not scheduled';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
}

function daysUntil(value?: string) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${value}T00:00:00`);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard({ 
  matters, 
  setActiveTab, 
  onSelectMatter, 
  openNewMatterModal, 
  openDeadlineCalcModal 
}: DashboardProps) {
  const upcoming = useMemo(() => matters
    .filter((matter) => matter.nextHearingDate)
    .sort((a, b) => (a.nextHearingDate || '').localeCompare(b.nextHearingDate || ''))
    .slice(0, 5), [matters]);

  const activeMatters = matters.filter(
    (matter) => matter.status === 'active' || matter.status === 'adjourned'
  );
  
  const closedMatters = matters.filter(
    (matter) => matter.status === 'closed' || matter.status === 'won' || matter.status === 'lost'
  );
  
  const urgentCount = matters.filter((matter) => {
    const days = daysUntil(matter.nextHearingDate);
    return days !== null && days >= 0 && days <= 7;
  }).length;

  return (
    <div className="page-stack">
      <section className="hero-command">
        <div className="hero-command-copy">
          <div className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" /> {greeting()}, Counsel
          </div>
          <h1 className="hero-title">Your practice, <em>in order.</em></h1>
          <p className="hero-subtitle">
            A calm, reliable desk for the matters, hearings, and decisions 
            that need your attention today.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button onClick={openNewMatterModal} className="button-primary">
              <Plus className="h-4 w-4" /> Open a matter
            </button>
            <button onClick={() => setActiveTab('matters')} className="button-secondary">
              Review matter register <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="hero-command-seal">
          <div className="seal-ring"><Gavel className="h-7 w-7" /></div>
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--gold)]">
            Counsel's desk
          </span>
          <span className="mt-1 text-center text-[11px] leading-4 text-[var(--text-muted)]">
            Clarity before  
the next appearance
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard 
          label="Active matters" 
          value={activeMatters.length} 
          detail="Under active attention" 
          icon={<FolderOpen />} 
          accent="gold" 
        />
        <MetricCard 
          label="Next 7 days" 
          value={urgentCount} 
          detail="Hearings approaching" 
          icon={<Clock3 />} 
          accent="red" 
        />
        <MetricCard 
          label="Hearing diary" 
          value={upcoming.length} 
          detail="Upcoming appearances" 
          icon={<CalendarDays />} 
          accent="blue" 
        />
        <MetricCard 
          label="Closed record" 
          value={closedMatters.length} 
          detail="Matters concluded" 
          icon={<CheckCircle2 />} 
          accent="green" 
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="panel-card overflow-hidden">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Priority view</p>
              <h2 className="section-title">The next appearances</h2>
            </div>
            <button className="text-action" onClick={() => setActiveTab('reminders')}>
              Open hearing diary <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState 
              icon={<CalendarDays />} 
              title="No hearings on the diary" 
              body="Add a next hearing date to a matter and it will appear here." 
              action="View matters" 
              onAction={() => setActiveTab('matters')} 
            />
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {upcoming.map((matter) => {
                const days = daysUntil(matter.nextHearingDate);
                return (
                  <button 
                    key={matter.id} 
                    onClick={() => onSelectMatter(matter)} 
                    className="matter-row group w-full text-left"
                  >
                    <div className={`date-tile ${days !== null && days <= 7 ? 'date-tile-urgent' : ''}`}>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
                        {matter.nextHearingDate ? new Date(`${matter.nextHearingDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short' }) : ''}
                      </span>
                      <strong>
                        {matter.nextHearingDate ? new Date(`${matter.nextHearingDate}T00:00:00`).getDate() : '—'}
                      </strong>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="matter-number">{matter.suitNumber}</span>
                        <DocketStamp status={matter.status} size="sm" />
                      </div>
                      <p className="mt-1 truncate text-[13px] font-semibold text-[var(--text-main)]">
                        {matter.title}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                        {matter.purpose || 'Appearance'} · {matter.court || 'Court not specified'}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className={`text-[12px] font-semibold ${days !== null && days <= 7 ? 'text-[var(--alert-red)]' : 'text-[var(--text-main)]'}`}>
                        {days === 0 ? 'Today' : days !== null && days > 0 ? `In ${days} days` : 'Review date'}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                        {displayDate(matter.nextHearingDate)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Quick actions</p>
              <h2 className="section-title">Work with intention</h2>
            </div>
          </div>
          <div className="space-y-2">
            <QuickAction 
              icon={<FilePlus2 />} 
              title="Open a new matter" 
              body="Create a private matter workspace" 
              onClick={openNewMatterModal} 
            />
            <QuickAction 
              icon={<ShieldCheck />} 
              title="Calculate a deadline" 
              body="Check a procedural window" 
              onClick={openDeadlineCalcModal} 
            />
            <QuickAction 
              icon={<Users />} 
              title="Review your matters" 
              body={`${matters.length} matter${matters.length === 1 ? '' : 's'} in your register`} 
              onClick={() => setActiveTab('matters')} 
            />
          </div>
          <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Practice principle
            </p>
            <p className="mt-2 font-serif-title text-[15px] leading-6 text-[var(--text-main)]">
              “The good lawyer is not hurried; the good lawyer is prepared.”
            </p>
          </div>
        </section>
      </div>

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Matter register</p>
            <h2 className="section-title">Recently updated</h2>
          </div>
          <button className="text-action" onClick={() => setActiveTab('matters')}>
            See all matters <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {matters.length === 0 ? (
          <EmptyState 
            icon={<FolderOpen />} 
            title="Your register is ready" 
            body="Open your first matter to create a secure workspace for its papers, appearances, and collaborators." 
            action="Open a matter" 
            onAction={openNewMatterModal} 
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {matters.slice(0, 6).map((matter) => (
              <button 
                key={matter.id} 
                onClick={() => onSelectMatter(matter)} 
                className="matter-card group text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="matter-number">{matter.suitNumber}</span>
                  <DocketStamp status={matter.status} size="sm" />
                </div>
                <h3 className="mt-4 line-clamp-2 font-serif-title text-[16px] font-semibold leading-5 text-[var(--text-main)] group-hover:text-[var(--gold)]">
                  {matter.title}
                </h3>
                <p className="mt-2 truncate text-[11px] text-[var(--text-muted)]">
                  {matter.court || 'Court not specified'} · Updated {displayDate(matter.updatedAt?.slice(0, 10))}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {Object.keys(matter.members || {}).length} collaborator{Object.keys(matter.members || {}).length === 1 ? '' : 's'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ 
  label, value, detail, icon, accent 
}: { 
  label: string; value: number; detail: string; icon: ReactNode; accent: 'gold' | 'red' | 'blue' | 'green' 
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon metric-icon-${accent}`}>{icon}</div>
      <p className="mt-4 text-[11px] font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-serif-title text-[28px] font-semibold leading-none text-[var(--text-main)]">
        {value}
      </p>
      <p className="mt-2 text-[10px] text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}

function QuickAction({ 
  icon, title, body, onClick 
}: { 
  icon: ReactNode; title: string; body: string; onClick: () => void 
}) {
  return (
    <button onClick={onClick} className="quick-action group w-full text-left">
      <span className="quick-action-icon">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-[var(--text-main)]">{title}</span>
        <span className="mt-0.5 block truncate text-[10px] text-[var(--text-muted)]">{body}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" />
    </button>
  );
}

function EmptyState({ 
  icon, title, body, action, onAction 
}: { 
  icon: ReactNode; title: string; body: string; action: string; onAction: () => void 
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="font-serif-title text-[17px] font-semibold text-[var(--text-main)]">{title}</h3>
      <p className="mt-2 max-w-sm text-[12px] leading-5 text-[var(--text-muted)]">{body}</p>
      <button onClick={onAction} className="button-secondary mt-5">
        {action} <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
