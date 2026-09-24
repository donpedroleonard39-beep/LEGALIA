import React, { useMemo, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FolderOpen,
  Plus,
} from 'lucide-react';
import { Matter } from '../types';
import { useAuth } from '../context/AuthContext';
import { DocketStamp } from './common/DocketStamp';
import { daysUntil, formatDate, isOpenStatus, parseLocalDate, relativeDay } from '../utils/dates';

interface DashboardProps {
  matters: Matter[];
  setActiveTab: (tab: string) => void;
  onSelectMatter: (matter: Matter) => void;
  openNewMatterModal: () => void;
  openDeadlineCalcModal: () => void;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard({ matters, setActiveTab, onSelectMatter, openNewMatterModal }: DashboardProps) {
  const { currentUser } = useAuth();
  const firstName = (currentUser?.name || '').split(/\s+/).find((w) => !/^(barr\.?|mr\.?|mrs\.?|ms\.?|dr\.?|hon\.?)$/i.test(w)) || '';

  const openMatters = useMemo(() => matters.filter((m) => isOpenStatus(m.status)), [matters]);

  // Only future (or today's) hearings on open matters count as "upcoming".
  const upcoming = useMemo(() => openMatters
    .filter((m) => { const d = daysUntil(m.nextHearingDate); return d !== null && d >= 0; })
    .sort((a, b) => (a.nextHearingDate || '').localeCompare(b.nextHearingDate || '')), [openMatters]);

  // An open matter whose hearing date has passed needs the user to record
  // what happened and set the next date - surface that instead of mixing
  // stale dates into the upcoming list.
  const needsUpdate = useMemo(() => openMatters
    .filter((m) => { const d = daysUntil(m.nextHearingDate); return d !== null && d < 0; })
    .sort((a, b) => (b.nextHearingDate || '').localeCompare(a.nextHearingDate || '')), [openMatters]);

  const thisWeek = upcoming.filter((m) => (daysUntil(m.nextHearingDate) ?? 99) <= 7).length;
  const closedCount = matters.length - openMatters.length;
  const isNew = matters.length === 0;

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <h1 className="page-title">{greeting()}{firstName ? `, ${firstName}` : ''}.</h1>
          <p className="page-subtitle">
            {isNew
              ? 'Welcome to Legalia. Start by adding your first matter — it takes under a minute.'
              : thisWeek > 0
                ? `You have ${thisWeek} hearing${thisWeek === 1 ? '' : 's'} in the next 7 days.`
                : 'No hearings in the next 7 days.'}
            {needsUpdate.length > 0 && ` ${needsUpdate.length} matter${needsUpdate.length === 1 ? ' needs' : 's need'} an update.`}
          </p>
        </div>
        <button onClick={openNewMatterModal} className="button-primary">
          <Plus className="h-4 w-4" /> New matter
        </button>
      </section>

      {isNew ? (
        <GettingStarted onNewMatter={openNewMatterModal} onPeople={() => setActiveTab('collaborators')} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Open matters" value={openMatters.length} icon={<FolderOpen />} accent="gold" onClick={() => setActiveTab('matters')} />
            <MetricCard label="Hearings this week" value={thisWeek} icon={<Clock3 />} accent="red" onClick={() => setActiveTab('reminders')} />
            <MetricCard label="Upcoming hearings" value={upcoming.length} icon={<CalendarDays />} accent="blue" onClick={() => setActiveTab('reminders')} />
            <MetricCard label="Closed matters" value={closedCount} icon={<CheckCircle2 />} accent="green" onClick={() => setActiveTab('matters')} />
          </section>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <section className="panel-card overflow-hidden">
              <div className="panel-heading">
                <h2 className="section-title">Upcoming hearings</h2>
                <button className="text-action" onClick={() => setActiveTab('reminders')}>
                  See all <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays />}
                  title="No upcoming hearings"
                  body="Open a matter and set its next hearing date. It will show here and everyone on the matter gets a reminder the day before."
                  action="Go to matters"
                  onAction={() => setActiveTab('matters')}
                />
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {upcoming.slice(0, 6).map((matter) => <HearingRow key={matter.id} matter={matter} onSelect={onSelectMatter} />)}
                </div>
              )}
            </section>

            <section className="panel-card">
              <div className="panel-heading">
                <div>
                  <h2 className="section-title">Needs an update</h2>
                  <p className="mt-1 text-[13px] text-[var(--text-muted)]">The hearing date has passed. Record what happened and set the next date.</p>
                </div>
              </div>
              {needsUpdate.length === 0 ? (
                <p className="flex items-center gap-2 py-4 text-[14px] text-[var(--text-muted)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--verdict-green)]" /> All caught up.
                </p>
              ) : (
                <div className="space-y-2">
                  {needsUpdate.slice(0, 5).map((matter) => (
                    <button key={matter.id} onClick={() => onSelectMatter(matter)} className="quick-action w-full text-left">
                      <span className="quick-action-icon !bg-[rgba(183,120,36,.12)] !text-[var(--caution-amber)]"><AlertTriangle /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-[var(--text-main)]">{matter.title}</span>
                        <span className="mt-0.5 block text-[12px] text-[var(--text-muted)]">
                          {matter.suitNumber} · was {formatDate(matter.nextHearingDate)}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="panel-card">
            <div className="panel-heading">
              <h2 className="section-title">Recently updated</h2>
              <button className="text-action" onClick={() => setActiveTab('matters')}>
                All matters <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {matters.slice(0, 6).map((matter) => (
                <button key={matter.id} onClick={() => onSelectMatter(matter)} className="matter-card group text-left">
                  <div className="flex items-start justify-between gap-3">
                    <span className="matter-number">{matter.suitNumber}</span>
                    <DocketStamp status={matter.status} size="sm" />
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-serif-title text-[17px] font-semibold leading-6 text-[var(--text-main)]">
                    {matter.title}
                  </h3>
                  <p className="mt-2 truncate text-[13px] text-[var(--text-muted)]">
                    {matter.court || 'Court not added'}
                  </p>
                  <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-[13px] text-[var(--text-muted)]">
                    Next hearing: <span className="font-medium text-[var(--text-main)]">{formatDate(matter.nextHearingDate)}</span>
                  </p>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const HearingRow: React.FC<{ matter: Matter; onSelect: (m: Matter) => void }> = ({ matter, onSelect }) => {
  const days = daysUntil(matter.nextHearingDate) ?? 99;
  const date = parseLocalDate(matter.nextHearingDate);
  const soon = days <= 7;
  return (
    <button onClick={() => onSelect(matter)} className="matter-row group w-full text-left">
      <div className={`date-tile ${soon ? 'date-tile-urgent' : ''}`}>
        <span className="font-mono text-[12px] uppercase tracking-[0.1em]">{date?.toLocaleDateString(undefined, { month: 'short' })}</span>
        <strong>{date?.getDate()}</strong>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-[var(--text-main)]">{matter.title}</p>
        <p className="mt-1 truncate text-[13px] text-[var(--text-muted)]">
          {matter.suitNumber} · {matter.purpose || 'Hearing'} · {matter.court || 'Court not added'}
        </p>
      </div>
      <p className={`hidden shrink-0 text-[13px] font-semibold sm:block ${soon ? 'text-[var(--alert-red)]' : 'text-[var(--text-main)]'}`}>
        {relativeDay(matter.nextHearingDate)}
      </p>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" />
    </button>
  );
};

function GettingStarted({ onNewMatter, onPeople }: { onNewMatter: () => void; onPeople: () => void }) {
  const steps = [
    { title: 'Add your first matter', body: 'Just the suit number and the claimant. You can fill in the rest later.', action: 'Add matter', onClick: onNewMatter },
    { title: 'Set the next hearing date', body: 'Everyone on the matter gets an email and in-app reminder the day before.', action: null, onClick: undefined },
    { title: 'Invite your lawyer, client or team', body: 'Share a link from the matter’s People tab. You choose if they can edit or only view.', action: 'How sharing works', onClick: onPeople },
  ];
  return (
    <section className="panel-card">
      <h2 className="section-title">Get started in 3 steps</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] p-4">
            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gold)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-[var(--text-main)]">{i + 1}. {step.title}</p>
              <p className="mt-1 text-[14px] text-[var(--text-muted)]">{step.body}</p>
            </div>
            {step.action && (
              <button onClick={step.onClick} className={i === 0 ? 'button-primary shrink-0' : 'button-secondary shrink-0'}>
                {step.action}
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function MetricCard({ label, value, icon, accent, onClick }: { label: string; value: number; icon: ReactNode; accent: 'gold' | 'red' | 'blue' | 'green'; onClick: () => void }) {
  return (
    <button onClick={onClick} className="metric-card !min-h-0 text-left transition hover:border-[var(--gold)]">
      <div className={`metric-icon metric-icon-${accent}`}>{icon}</div>
      <p className="mt-3 font-serif-title text-[30px] font-semibold leading-none text-[var(--text-main)]">{value}</p>
      <p className="mt-2 text-[13px] font-medium text-[var(--text-muted)]">{label}</p>
    </button>
  );
}

function EmptyState({ icon, title, body, action, onAction }: { icon: ReactNode; title: string; body: string; action: string; onAction: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="font-serif-title text-[17px] font-semibold text-[var(--text-main)]">{title}</h3>
      <p className="mt-2 max-w-sm text-[14px] leading-6 text-[var(--text-muted)]">{body}</p>
      <button onClick={onAction} className="button-secondary mt-5">
        {action} <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
