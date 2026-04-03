import { useNavigate } from 'react-router-dom';
import { FileText, TrendingUp, Sparkles, Scale, ChevronRight } from 'lucide-react';

const SENTIMENT_ICON_MAP = {
  trending_up: TrendingUp,
  auto_awesome: Sparkles,
  balance: Scale,
};

export default function MeetingRow({ meeting }) {
  const navigate = useNavigate();
  // Using FileText as the default icon for transcripts
  const SentimentIcon = SENTIMENT_ICON_MAP[meeting.sentimentIcon] || TrendingUp;

  // Fallback values just in case the backend hasn't been updated to send decisions yet
  const decisionCount = meeting.decisions !== undefined ? meeting.decisions : 0;

  const displayDate = meeting.date 
  ? new Date(meeting.date).toLocaleString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    })
  : "Unknown Date";

  return (
    <div 
      onClick={() => navigate(`/meeting/${meeting.id}`)}
      className="group bg-surface-container-lowest hover:bg-surface-bright p-5 rounded-xl transition-all duration-300 flex flex-col xl:flex-row items-start xl:items-center gap-6 cursor-pointer border border-transparent hover:border-outline-variant/10 shadow-sm hover:shadow-md"
    >
      {/* Icon & Primary Info (File Name + Date) */}
      <div className="flex items-center gap-4 flex-grow w-full xl:w-auto">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${meeting.iconBgClass || 'bg-blue-100'}`}>
          <FileText className={meeting.iconColorClass || 'text-blue-600'} size={24} />
        </div>
        <div className="flex-grow text-left overflow-hidden">
          <h4 className="text-base font-bold text-on-surface mb-1 truncate" title={meeting.title}>{meeting.title}</h4>
          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{displayDate}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:flex items-center gap-6 w-full xl:w-auto mt-2 xl:mt-0 bg-slate-50 xl:bg-transparent p-4 xl:p-0 rounded-lg">
        
        <div className="flex flex-col xl:items-center">
          <span className="text-lg font-bold text-slate-700">{meeting.transcripts || 1}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Transcripts</span>
        </div>

        <div className="flex flex-col xl:items-center">
          <span className="text-lg font-bold text-slate-700">{meeting.actions || 0}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Actions</span>
        </div>

        <div className="flex flex-col xl:items-center">
          <span className="text-lg font-bold text-slate-700">{decisionCount}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Decisions</span>
        </div>

        <div className="flex flex-col xl:items-center">
          <div className={`flex items-center gap-1 ${meeting.sentimentColorClass || 'text-emerald-600'}`}>
            <span className="text-lg font-bold">{meeting.sentiment || 85}%</span>
            <SentimentIcon size={14} />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Sentiment</span>
        </div>

      </div>

      {/* Arrow Indicator */}
      <div className="flex-shrink-0 ml-2 hidden xl:block">
        <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" size={24} />
      </div>
    </div>
  );
}