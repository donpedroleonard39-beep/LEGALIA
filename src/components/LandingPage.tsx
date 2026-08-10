import React from 'react';
import {
  Gavel,
  Clock,
  Users,
  FileCheck,
  ArrowRight,
  Database,
  Search,
} from 'lucide-react';

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab, openAuthModal }) => {
  return (
    <div className="w-full min-h-screen bg-[#12172B] text-[#F6F3EC] flex flex-col justify-between overflow-x-hidden text-[13px]">
      
      {/* Hero Header */}
      <div className="relative pt-12 pb-20 px-6 max-w-6xl mx-auto text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#B8935F]/15 border border-[#B8935F]/30 text-[#B8935F] text-[13px] font-semibold mb-6">
          <Gavel className="w-4 h-4" />
          Modern Litigation & Cause List Infrastructure
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-[#F6F3EC] max-w-3xl mx-auto leading-tight">
          Precision Legal Proceedings & Court Cause List Management
        </h1>

        <p className="mt-6 text-[#8A90AC] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Manage court suits, track presiding judge schedules, automate statutory deadlines, delegate team access, and search party conflict records in one high-security workspace connected to Cloud Firestore.
        </p>

        {/* CTA Group */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] font-bold text-sm shadow-sm transition"
          >
            Enter Practice Registry <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={openAuthModal}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[rgba(184,147,95,0.3)] bg-[#1B2140] hover:bg-[#1B2140]/80 text-[#F6F3EC] font-semibold text-sm transition"
          >
            Sign In / Register Account
          </button>
        </div>

      </div>

      {/* Feature Grid Section */}
      <div className="py-16 px-6 bg-[#12172B] border-t border-[rgba(184,147,95,0.2)]">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#F6F3EC]">
              Built for High-Stakes Litigation Practice
            </h2>
            <p className="mt-2 text-[#8A90AC] text-sm">
              Purpose-built for law firms, advocacy chambers, and corporate legal departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Gavel className="w-4 h-4 text-[#B8935F]" />
              </div>
              <h3 className="font-serif font-semibold text-base text-[#F6F3EC] mb-2">Court Cause List & Judge Tracking</h3>
              <p className="text-[13px] text-[#8A90AC] leading-relaxed">
                Log suit numbers, presiding judges, court divisions, plot descriptions, hearing dates, and appearances.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Clock className="w-4 h-4 text-[#B8935F]" />
              </div>
              <h3 className="font-serif font-semibold text-base text-[#F6F3EC] mb-2">Statutory Deadline Calculator</h3>
              <p className="text-[13px] text-[#8A90AC] leading-relaxed">
                Automate compliance for Statement of Claim, Defense, Reply, and Pre-Trial Conference statutory windows.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Search className="w-4 h-4 text-[#B8935F]" />
              </div>
              <h3 className="font-serif font-semibold text-base text-[#F6F3EC] mb-2">Conflict of Interest Checker</h3>
              <p className="text-[13px] text-[#8A90AC] leading-relaxed">
                Instantly scan party names, defendants, plot titles, and opposing counsel before accepting new briefs.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Users className="w-4 h-4 text-[#B8935F]" />
              </div>
              <h3 className="font-serif font-semibold text-base text-[#F6F3EC] mb-2">Granular Role & Team Access</h3>
              <p className="text-[13px] text-[#8A90AC] leading-relaxed">
                Restrict access on a per-matter basis using team membership security controls for partners, lawyers, and clients.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <FileCheck className="w-4 h-4 text-[#B8935F]" />
              </div>
              <h3 className="font-serif font-semibold text-base text-[#F6F3EC] mb-2">Document Vault & Versioning</h3>
              <p className="text-[13px] text-[#8A90AC] leading-relaxed">
                Store pleadings, motions, exhibits, and affidavits indexed by suit number with version tracking and full case bundle exports.
              </p>
            </div>

            <div className="legal-card p-6">
              <div className="icon-box-32 mb-4">
                <Database className="w-4 h-4 text-[#B8935F]" />
              </div>
              <h3 className="font-serif font-semibold text-base text-[#F6F3EC] mb-2">Escaped CSV & Printable Bundles</h3>
              <p className="text-[13px] text-[#8A90AC] leading-relaxed">
                Export clean, formatted CSV registry data or generate court-ready printable case bundle briefs with timeline records.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[rgba(184,147,95,0.2)] text-center text-[13px] text-[#8A90AC]">
        LEGALIA Legal Proceedings Manager &bull; Enterprise Case Infrastructure &bull; Powered by Firebase Firestore & Auth
      </footer>

    </div>
  );
};
