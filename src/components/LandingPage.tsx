import React from 'react';
import {
  Gavel,
  Clock,
  Users,
  FileCheck,
  ArrowRight,
  Database,
  Bell,
} from 'lucide-react';
import { LogoMark } from './common/LogoMark';

interface LandingPageProps {
  isAuthed: boolean;
  setActiveTab?: (tab: string) => void;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  /** Set when the visitor came from an invite link and closed the sign-in box. */
  onInviteBanner?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ isAuthed, setActiveTab, openAuthModal, onInviteBanner }) => {
  const enterPractice = () => {
    if (isAuthed && setActiveTab) {
      setActiveTab('dashboard');
    } else {
      openAuthModal('signup');
    }
  };

  return (
    <div className="landing w-full min-h-screen flex flex-col justify-between overflow-x-hidden text-[14px]">
      
      {onInviteBanner && (
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-3 text-center text-[14px]" style={{ background: 'var(--gold-soft)', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--paper)' }}>You’ve been invited to a matter on Legalia.</span>
          <button onClick={onInviteBanner} className="button-primary !min-h-[32px] !py-1 text-[13px]">Sign in to accept</button>
        </div>
      )}

      {/* Top bar with the logo */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2.5">
          <LogoMark size={38} />
          <span className="font-serif text-[21px] font-semibold tracking-tight" style={{ color: 'var(--paper)' }}>Legalia</span>
        </div>
        {!isAuthed && (
          <button onClick={() => openAuthModal('signin')} className="text-[14px] font-semibold" style={{ color: 'var(--gold)' }}>
            Sign in
          </button>
        )}
      </header>

      {/* Hero Header */}
      <div className="relative pt-12 pb-20 px-6 max-w-6xl mx-auto text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[13px] font-semibold mb-6" style={{ background: 'var(--gold-soft)', border: '1px solid rgba(208,173,114,.32)', color: 'var(--gold)' }}>
          <Gavel className="w-4 h-4" />
          Personal Litigation & Matter Tracking
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight max-w-3xl mx-auto leading-tight" style={{ color: 'var(--paper)' }}>
          Keep every suit, hearing date, and note in one private record
        </h1>

        <p className="mt-6 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Whether you're the lawyer or the client, open a matter, track suit numbers, judges, and hearing dates, and invite the people who need visibility — with reminders sent automatically as dates approach.
        </p>

        {/* CTA Group */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={enterPractice}
            className="button-primary text-sm"
          >
            {isAuthed ? 'Open your matters' : 'Get started free'} <ArrowRight className="w-4 h-4" />
          </button>
          {!isAuthed && (
            <button onClick={() => openAuthModal('signin')} className="button-secondary text-sm">
              I already have an account
            </button>
          )}
        </div>

        {/* How it works - three steps so a first-time visitor knows what to do inside */}
        <ol className="mt-14 grid gap-4 text-left sm:grid-cols-3">
          {[
            ['Open a matter', 'Enter the suit number and the parties. Everything else can wait.'],
            ['Add the next hearing date', 'Everyone on the matter gets a reminder the day before.'],
            ['Share a link', 'Send your lawyer, client or colleague a link. You choose if they can edit or only view.'],
          ].map(([title, body], i) => (
            <li key={title} className="legal-card !p-5">
              <span className="font-mono text-[12px] font-bold" style={{ color: 'var(--gold)' }}>STEP {i + 1}</span>
              <p className="mt-2 font-semibold text-[15px]" style={{ color: 'var(--paper)' }}>{title}</p>
              <p className="mt-1 text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{body}</p>
            </li>
          ))}
        </ol>

      </div>

      {/* Feature Grid Section */}
      <div className="py-16 px-6" style={{ borderTop: '1px solid rgba(184,147,95,.2)' }}>
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--paper)' }}>
              Built for anyone with a matter to track
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              For lawyers, clients, and litigants alike — no firm account or admin required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Gavel className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="font-serif font-semibold text-base mb-2" style={{ color: 'var(--paper)' }}>Suit & Hearing Tracking</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Keep suit numbers, judges, courts, hearing dates and what happened at each hearing in one place.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Clock className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="font-serif font-semibold text-base mb-2" style={{ color: 'var(--paper)' }}>Deadline Calculator</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Get a rough timeline for appearance, defence, reply and pre-trial dates. A planning aid — always check your court's rules.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Bell className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="font-serif font-semibold text-base mb-2" style={{ color: 'var(--paper)' }}>Automatic Hearing Reminders</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Set a hearing date on a matter and everyone with access gets an email and in-app reminder the day before.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Users className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="font-serif font-semibold text-base mb-2" style={{ color: 'var(--paper)' }}>Invite the People on the Matter</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Bring in your lawyer, your client, or a co-litigant with a link, and choose exactly what they can view or edit.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <FileCheck className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="font-serif font-semibold text-base mb-2" style={{ color: 'var(--paper)' }}>Printable Case Briefs</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Print a clean one-page brief of a matter and its history whenever you need a paper copy.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Database className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="font-serif font-semibold text-base mb-2" style={{ color: 'var(--paper)' }}>CSV Export</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Export your matters as clean, formatted CSV data whenever you need it outside the app.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-[13px]" style={{ borderTop: '1px solid rgba(184,147,95,.2)', color: 'var(--text-muted)' }}>
        Legalia — your matters, hearings and reminders in one place
      </footer>

    </div>
  );
};
