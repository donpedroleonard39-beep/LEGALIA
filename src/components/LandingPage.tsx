import React from 'react';
import {
  Scale,
  Gavel,
  ShieldCheck,
  Clock,
  Users,
  FileCheck,
  Sparkles,
  ArrowRight,
  Database,
  Search,
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab, openAuthModal }) => {
  const { switchDemoUser } = useAuth();

  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between overflow-x-hidden">
      
      {/* Hero Header */}
      <div className="relative pt-12 pb-20 px-6 max-w-6xl mx-auto text-center">
        
        {/* Glow backdrop */}
        <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-30 blur-3xl">
          <div className="w-96 h-96 bg-amber-600 rounded-full"></div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Modern Litigation & Cause List Infrastructure
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Precision Legal Proceedings & Court Cause List Management
        </h1>

        <p className="mt-6 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Manage court suits, track presiding judge schedules, automate statutory deadlines, delegate team access, and search party conflict records in one high-security workspace.
        </p>

        {/* CTA Group */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => {
              switchDemoUser('lawyer_chisom');
              setActiveTab('dashboard');
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/30 transition transform hover:-translate-y-0.5"
          >
            Launch Interactive Workspace <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={openAuthModal}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition"
          >
            Sign In / Register Account
          </button>
        </div>

        {/* Instant Role Persona Quick Switches */}
        <div className="mt-12 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 max-w-xl mx-auto text-xs">
          <div className="text-slate-400 font-medium mb-3">Try Instant Role Switcher (No Password Required):</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => {
                switchDemoUser('admin_demo');
                setActiveTab('dashboard');
              }}
              className="p-2 rounded-lg bg-slate-700/60 hover:bg-amber-600/20 hover:border-amber-500/40 border border-slate-600 text-left transition"
            >
              <div className="font-bold text-amber-300">Managing Partner</div>
              <div className="text-[10px] text-slate-400">Full Firm Admin</div>
            </button>

            <button
              onClick={() => {
                switchDemoUser('lawyer_chisom');
                setActiveTab('dashboard');
              }}
              className="p-2 rounded-lg bg-slate-700/60 hover:bg-amber-600/20 hover:border-amber-500/40 border border-slate-600 text-left transition"
            >
              <div className="font-bold text-amber-300">Lead Counsel</div>
              <div className="text-[10px] text-slate-400">Barr. Chisom</div>
            </button>

            <button
              onClick={() => {
                switchDemoUser('paralegal_joy');
                setActiveTab('dashboard');
              }}
              className="p-2 rounded-lg bg-slate-700/60 hover:bg-amber-600/20 hover:border-amber-500/40 border border-slate-600 text-left transition"
            >
              <div className="font-bold text-amber-300">Paralegal</div>
              <div className="text-[10px] text-slate-400">Joy Litigation</div>
            </button>

            <button
              onClick={() => {
                switchDemoUser('client_ibe');
                setActiveTab('dashboard');
              }}
              className="p-2 rounded-lg bg-slate-700/60 hover:bg-amber-600/20 hover:border-amber-500/40 border border-slate-600 text-left transition"
            >
              <div className="font-bold text-amber-300">Client Portal</div>
              <div className="text-[10px] text-slate-400">Mr. Ibe Aforka</div>
            </button>
          </div>
        </div>

      </div>

      {/* Feature Grid Section */}
      <div className="py-16 px-6 bg-slate-950/80 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Built for High-Stakes Litigation Practice
            </h2>
            <p className="mt-2 text-slate-400 text-sm">
              Purpose-built for law firms, advocacy chambers, and corporate legal departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Gavel className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Court Cause List & Judge Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log suit numbers, presiding judges, court divisions, plot descriptions, hearing dates, and appearances.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Statutory Deadline Calculator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automate compliance for Statement of Claim, Defense, Reply, and Pre-Trial Conference statutory windows.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Conflict of Interest Checker</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instantly scan party names, defendants, plot titles, and opposing counsel before accepting new briefs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Granular Role & Team Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Restrict access on a per-matter basis using team membership security controls for partners, lawyers, and clients.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Document Vault & Versioning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Store pleadings, motions, exhibits, and affidavits indexed by suit number with version tracking and full case bundle exports.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Escaped CSV & Printable Bundles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export clean, formatted CSV registry data or generate court-ready printable case bundle briefs with timeline records.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800 text-center text-xs text-slate-500">
        LEGALIA Legal Proceedings Manager &bull; Enterprise Case Infrastructure &bull; Powered by Firebase Firestore & Auth
      </footer>

    </div>
  );
};
