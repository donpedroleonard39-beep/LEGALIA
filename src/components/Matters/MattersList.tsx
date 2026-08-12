import { useMemo, useState } from 'react';
import { ArrowRight, Download, Filter, FolderOpen, Gavel, LayoutGrid, List, Plus, Search, SlidersHorizontal } from 'lucide-react';
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

export function MattersList({ matters, onSelectMatter, openNewMatterModal, searchQuery, setSearchQuery }: MattersListProps) {
  const [selectedStatus, setSelectedStatus] = useState<'all' | MatterStatus>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      
      return (!term || haystack.includes(term)) && (selectedStatus === 'all' || matter.status === selectedStatus);
    });
  }, [matters, searchQuery, selectedStatus]);

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
          <button 
            onClick={() => setFiltersOpen((open) => !open)} 
            className={`button-secondary ${filtersOpen ? 'button-secondary-active' : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters 
            <span className="hidden sm:inline">{selectedStatus !== 'all' ? `· ${selectedStatus}` : ''}</span>
          </button>
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
        
        {filtersOpen && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
            <span className="mr-1 text-[11px] font-medium text-[var(--text-muted)]">Show</span>
            {statuses.map((status) => (
              <button 
                key={status} 
                onClick={() => setSelectedStatus(status)} 
                className={`filter-chip ${selectedStatus === status ? 'filter-chip-active' : ''}`}
              >
                {status === 'all' ? 'All matters' : status}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-[var(--text-muted)]">{filteredMatters.length} of {matters.length}</span>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-main)]">{filteredMatters.length}</span> {filteredMatters.length === 1 ? 'matter' : 'matters'} in view
        </p>
        <p className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-muted)] sm:block">Access is matter-specific</p>
      </div>

      {filteredMatters.length === 0 ? (
        <div className="panel-card">
          <div className="empty-state">
            <div className="empty-state-icon"><FolderOpen className="h-6 w-6" /></div>
            <h2 className="font-serif-title text-[18px] font-semibold">{matters.length === 0 ? 'Your register is empty' : 'No matters match that search'}</h2>
            <p className="mt-2 max-w-sm text-center text-[12px] leading-5 text-[var(--text-muted)]">
              {matters.length === 0 
                ? 'Open a matter to create a secure workspace for its papers, people, and appearances.' 
                : 'Try a different party name, suit number, or status filter.'}
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

function MatterCard({ matter, onSelect }: { matter: Matter; onSelect: (matter: Matter) => void }) {
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
}

function MatterListRow({ matter, onSelect }: { matter: Matter; onSelect: (matter: Matter) => void }) {
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
}
