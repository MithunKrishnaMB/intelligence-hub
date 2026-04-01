import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import UploadSection from '../components/dashboard/UploadSection';
import MeetingRow from '../components/dashboard/MeetingRow';

const MOCK_MEETINGS = [
  {
    id: "1",
    icon: "groups",
    iconBgClass: "bg-secondary-container",
    iconColorClass: "text-on-secondary-container",
    title: "Q4 Strategy Sync: Architecture Alignment",
    date: "October 24, 2023 • 10:30 AM",
    transcripts: 4,
    actions: 12,
    sentiment: 85,
    sentimentIcon: "trending_up",
    sentimentColorClass: "text-emerald-600"
  },
  {
    id: "2",
    icon: "record_voice_over",
    iconBgClass: "bg-tertiary-container",
    iconColorClass: "text-on-tertiary-container",
    title: "Product Roadmap: Core UI Overhaul",
    date: "October 22, 2023 • 2:00 PM",
    transcripts: 2,
    actions: 7,
    sentiment: 92,
    sentimentIcon: "auto_awesome",
    sentimentColorClass: "text-primary"
  },
  {
    id: "3",
    icon: "chat_bubble",
    iconBgClass: "bg-surface-container-highest",
    iconColorClass: "text-on-surface-variant",
    title: "Customer Success: Ether One Feedback",
    date: "October 20, 2023 • 11:15 AM",
    transcripts: 1,
    actions: 18,
    sentiment: 71,
    sentimentIcon: "balance",
    sentimentColorClass: "text-slate-600"
  }
];

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col antialiased bg-surface text-on-surface">
      <Header />
      <main className="flex-grow pt-24 pb-12 px-6 lg:px-12 w-full max-w-[1440px] mx-auto">
        {/* Dashboard Greeting */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">Atmospheric Precision</h1>
          <p className="text-on-surface-variant text-lg">Curation of your organizational intelligence.</p>
        </div>
        
        {/* Upload Section */}
        <UploadSection />
        
        {/* Recent Meetings */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-on-surface tracking-tight">Recent Meetings</h3>
            <button className="text-primary font-semibold text-sm hover:underline border-none bg-transparent">View Archive</button>
          </div>
          <div className="grid gap-4">
            {MOCK_MEETINGS.map(meeting => (
              <MeetingRow key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
