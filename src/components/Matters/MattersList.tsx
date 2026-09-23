import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarRange, Download, FolderOpen, Gavel, LayoutGrid, List, Menu, Plus, Search, X } from 'lucide-react';
import { Matter, MatterStatus } from '../../types';
import { exportMattersToCsv } from '../../utils/csvExport';
import { DocketStamp } from '../common/DocketStamp';

interface MattersListProps {
  matters: Matter[];
  onSelectMatter: (matter: Matter) => void;
  openNewMatterModal: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const statuses: Array<'all' | MatterStatus> = ['all', 'active', 'adjourned', 'closed', 'won', 'lost'];

// Local-time YYYY-MM-DD, matching the format stored in matter.nextHearingDate.
const toISODate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export function MattersList({ matters, onSelectMatter, openNewMatterModal, searchQuery, setSearchQuery }: MattersListProps) {
  const [selectedStatus, setSelectedStatus] = useState<'all' | MatterStatus>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Close the filter menu on outside click or Escape.
  useEffect(() => {
    if (!filtersOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) setFiltersOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setFiltersOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [filtersOpen]);

  const hasDateFilter = Boolean(dateFrom || dateTo);
  const activeFilterCount = (selectedStatus !== 'all' ? 1 : 0) + (hasDateFilter ? 1 : 0);
  const clearAllFilters = () => { setSelectedStatus('all'); setDateFrom(''); setDateTo(''); };
  const applyRange = (from: string, to: string) => { setDateFrom(from); setDateTo(to); };
  const dateLabel = hasDateFilter
    ? dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : dateFrom ? `From ${dateFrom}` : `Until ${dateTo}`
    : '';

  const filteredMatters = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return matters.filter((matter) => {
      const haystack = [
        matter.suitNumber, 
        matter.title, 
        matter.court, 
        matter.judge, 
        matter.plot, 
        matter.purpose, 
        ...matter.plaintiffs, 
        ...matter.defendants
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (term && !haystack.includes(term)) return false;
      if (selectedStatus !== 'all' && matter.status !== selectedStatus) return false;

      // Date range applies to the next hearing date (YYYY-MM-DD, so string comparison is safe).
      if (dateFrom || dateTo) {
        if (!matter.nextHearingDate) return false;
        if (dateFrom && matter.nextHearingDate < dateFrom) return false;
        if (dateTo && matter.nextHearingDate > dateTo) return false;
      }
      return true;
    });
  }, [matters, searchQuery, selectedStatus, dateFrom, dateTo]);

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <div className="eyebrow"><Gavel className="h-3.5 w-3.5" /> Private matter register</div>
          <h1 className="page-title">Every matter has a <em>place.</em></h1>
          <p className="page-subtitle">Your accessible matters, organised for quick retrieval before the next call, conference, or appearance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportMattersToCsv(filteredMatters, 'legalia-matters')} className="button-secondary">
            <Download className="h-4 w-4" /> Export register
          </button>
          <button onClick={openNewMatterModal} className="button-primary">
            <Plus className="h-4 w-4" /> Open matter
          </button>
        </div>
      </section>

      <section className="panel-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              value={searchQuery} 
              onChange={(event) => setSearchQuery(event.target.value)} 
              placeholder="Search by suit number, party, court, judge, or subject…" 
              className="field-control w-full pl-10" 
            />
          </div>
          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => setFiltersOpen((open) => !open)}
              className={`button-secondary ${filtersOpen || activeFilterCount > 0 ? 'button-secondary-active' : ''}`}
              aria-haspopup="true"
              aria-expanded={filtersOpen}
              title="Filters"
            >
              <Menu className="h-4 w-4" /> Filters
              {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
            </button>

            {filtersOpen && (
              <div className="popover-panel right-0 top-full mt-2 w-[320px] max-w-[calc(100vw-2rem)] p-4">
                <div className="mb-2 text-[11px] font-medium text-[var(--text-muted)]">Status</div>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`filter-chip ${selectedStatus === status ? 'filter-chip-active' : ''}`}
                    >
                      {status === 'all' ? 'All matters' : status}
                    </button>
                  ))}
                </div>

                <div className="mb-2 mt-5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                  <CalendarRange className="h-3.5 w-3.5" /> Next hearing date
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[10px] text-[var(--text-muted)]">
                    From
                    <input
                      type="date"
                      value={dateFrom}
                      max={dateTo || undefined}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="field-control mt-1 w-full"
                    />
                  </label>
                  <label className="block text-[10px] text-[var(--text-muted)]">
                    To
                    <input
                      type="date"
                      value={dateTo}
                      min={dateFrom || undefined}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="field-control mt-1 w-full"
                    />
                  </label>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => applyRange(toISODate(new Date()), addDays(7))} className="filter-chip">Next 7 days</button>
                  <button onClick={() => applyRange(toISODate(new Date()), addDays(30))} className="filter-chip">Next 30 days</button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  <span className="text-[11px] text-[var(--text-muted)]">{filteredMatters.length} of {matters.length} matters</span>
                  <button
                    onClick={clearAllFilters}
                    disabled={activeFilterCount === 0}
                    className="text-action disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="hidden items-center rounded-xl border border-[var(--border-subtle)] p-1 sm:flex">
            <button 
              onClick={() => setViewMode('list')} 
              className={`view-toggle ${viewMode === 'list' ? 'view-toggle-active' : ''}`} 
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`view-toggle ${viewMode === 'grid' ? 'view-toggle-active' : ''}`} 
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[12px] text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">{filteredMatters.length}</span> {filteredMatters.length === 1 ? 'matter' : 'matters'} in view
          </p>
          {selectedStatus !== 'all' && (
            <button onClick={() => setSelectedStatus('all')} className="filter-chip filter-chip-active inline-flex items-center gap-1" title="Remove status filter">
              {selectedStatus} <X className="h-3 w-3" />
            </button>
          )}
          {hasDateFilter && (
            <button onClick={() => applyRange('', '')} className="filter-chip filter-chip-active inline-flex items-center gap-1" title="Remove date filter">
              {dateLabel} <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)] sm:block">Access is matter-specific</p>
      </div>

      {filteredMatters.length === 0 ? (
        <div className="panel-card">
          <div className="empty-state">
            <div className="empty-state-icon"><FolderOpen className="h-6 w-6" /></div>
            <h2 className="font-serif-title text-[18px] font-semibold">{matters.length === 0 ? 'Your register is empty' : 'No matters match these filters'}</h2>
            <p className="mt-2 max-w-sm text-center text-[12px] leading-5 text-[var(--text-muted)]">
              {matters.length === 0 
                ? 'Open a matter to create a secure workspace for its papers, people, and appearances.' 
                : 'Try a different party name, suit number, status, or date range.'}
            </p>
            {matters.length === 0 && (
              <button onClick={openNewMatterModal} className="button-primary mt-5">
                <Plus className="h-4 w-4" /> Open first matter
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredMatters.map((matter) => <MatterCard key={matter.id} matter={matter} onSelect={onSelectMatter} />)}
        </div>
      ) : (
        <section className="panel-card overflow-hidden">
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredMatters.map((matter) => <MatterListRow key={matter.id} matter={matter} onSelect={onSelectMatter} />)}
          </div>
        </section>
      )}
    </div>
  );
}

interface MatterCardProps { matter: Matter; onSelect: (matter: Matter) => void }
const MatterCard: React.FC<MatterCardProps> = ({ matter, onSelect }) => {
  return (
    <button onClick={() => onSelect(matter)} className="matter-card group text-left">
      <div className="flex items-start justify-between gap-3">
        <span className="matter-number">{matter.suitNumber}</span>
        <DocketStamp status={matter.status} size="sm" />
      </div>
      <h2 className="mt-4 line-clamp-2 font-serif-title text-[17px] font-semibold leading-5 text-[var(--text-main)] group-hover:text-[var(--gold)]">
        {matter.title}
      </h2>
      <div className="mt-4 space-y-2 text-[11px] text-[var(--text-muted)]">
        <p className="truncate">{matter.court || 'Court not specified'}{matter.judge ? ` · ${matter.judge}` : ''}</p>
        <p className="truncate">{matter.plaintiffs.join(', ') || 'Claimant not recorded'} v. {matter.defendants.join(', ') || 'Respondent not recorded'}</p>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {matter.nextHearingDate ? `Next · ${matter.nextHearingDate}` : 'No hearing date'}
        </span>
        <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" />
      </div>
    </button>
  );
};

interface MatterListRowProps { matter: Matter; onSelect: (matter: Matter) => void }
const MatterListRow: React.FC<MatterListRowProps> = ({ matter, onSelect }) => {
  return (
    <button onClick={() => onSelect(matter)} className="matter-list-row group w-full text-left">
      <div className="matter-row-mark"><Gavel className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="matter-number">{matter.suitNumber}</span>
          <DocketStamp status={matter.status} size="sm" />
        </div>
        <h2 className="mt-1 truncate font-serif-title text-[16px] font-semibold text-[var(--text-main)] group-hover:text-[var(--gold)]">
          {matter.title}
        </h2>
        <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
          {matter.court || 'Court not specified'}{matter.judge ? ` · ${matter.judge}` : ''} · {matter.defendants.join(', ') || 'No respondent recorded'}
        </p>
      </div>
      <div className="hidden min-w-[145px] text-right md:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">Next appearance</p>
        <p className="mt-1 text-[12px] font-semibold text-[var(--text-main)]">{matter.nextHearingDate || 'Not scheduled'}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" />
    </button>
  );
};
