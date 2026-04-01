import Header from '../components/layout/Header';
import SentimentDashboard from '../components/meeting/SentimentDashboard';
import DecisionsTable from '../components/meeting/DecisionsTable';
import ActionItems from '../components/meeting/ActionItems';
import Chatbot from '../components/shared/Chatbot';
import { Share2, MoreVertical } from 'lucide-react';

export default function MeetingDetail() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col">
      <Header />
      
      {/* Main Content Canvas */}
      <main className="flex-grow max-w-[1440px] mx-auto w-full px-6 py-12 pb-32 pt-24">
        <div className="flex justify-between items-start mb-12">
            <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest uppercase rounded-full">Product Strategy</span>
                <span className="text-on-surface-variant text-sm">October 24, 2023 • 45 mins</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-on-surface leading-tight max-w-3xl mb-0">
                Q4 Roadmap Alignment & Resource Allocation
            </h1>
            <p className="text-lg text-on-surface-variant max-w-2xl font-light leading-relaxed">
                Review of engineering capacity vs. high-priority features for the upcoming quarter. Alignment on key delivery milestones.
            </p>
            </div>
            <div className="flex items-center gap-4 mt-6">
                <button className="p-2 text-slate-500 hover:text-blue-500 transition-all duration-200 active:scale-95 bg-white shadow-sm border border-outline-variant/20 rounded-lg">
                    <Share2 size={20} />
                </button>
                <button className="p-2 text-slate-500 hover:text-blue-500 transition-all duration-200 active:scale-95 bg-white shadow-sm border border-outline-variant/20 rounded-lg">
                    <MoreVertical size={20} />
                </button>
            </div>
        </div>

        <SentimentDashboard />
        <DecisionsTable />
        <ActionItems />
      </main>

      <Chatbot />
    </div>
  );
}
