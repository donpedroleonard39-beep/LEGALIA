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

interface LandingPageProps {
  isAuthed: boolean;
  setActiveTab?: (tab: string) => void;
  openAuthModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ isAuthed, setActiveTab, openAuthModal }) => {
  const enterPractice = () => {
    if (isAuthed && setActiveTab) {
      setActiveTab('dashboard');
    } else {
      openAuthModal();
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-between overflow-x-hidden text-[13px]" style={{ background: 'var(--ink-raised)', color: 'var(--paper)' }}>
      
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
            {isAuthed ? 'Open your matters' : 'Sign in / register'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

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
                Log suit numbers, presiding judges, court divisions, plot descriptions, hearing dates, and appearances in one place.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Clock className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="font-serif font-semibold text-base mb-2" style={{ color: 'var(--paper)' }}>Statutory Deadline Calculator</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Estimate Statement of Claim, Defense, Reply, and Pre-Trial Conference windows under civil court rules.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Bell className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="font-serif font-semibold text-base mb-2" style={{ color: 'var(--paper)' }}>Automatic Hearing Reminders</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Set a hearing date on a matter and everyone with access is reminded automatically as it approaches — no manual scheduling.
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
                Generate a clean, court-ready printable brief from a matter's details whenever you need a physical copy.
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
        LEGALIA Personal Matter Tracker &bull; Built on Firebase
      </footer>

    </div>
  );
};
