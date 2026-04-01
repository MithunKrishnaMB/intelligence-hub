import { useNavigate } from 'react-router-dom';
import { Users, Mic, MessageSquare, TrendingUp, Sparkles, Scale, ChevronRight } from 'lucide-react';

const ICON_MAP = {
  groups: Users,
  record_voice_over: Mic,
  chat_bubble: MessageSquare,
};

const SENTIMENT_ICON_MAP = {
  trending_up: TrendingUp,
  auto_awesome: Sparkles,
  balance: Scale,
};

export default function MeetingRow({ meeting }) {
  const navigate = useNavigate();
  const Icon = ICON_MAP[meeting.icon] || Users;
  const SentimentIcon = SENTIMENT_ICON_MAP[meeting.sentimentIcon] || TrendingUp;

  return (
    <div 
      onClick={() => navigate(`/meeting/${meeting.id}`)}
      className="group bg-surface-container-lowest hover:bg-surface-bright p-6 rounded-xl transition-all duration-300 flex flex-col md:flex-row items-center gap-6 cursor-pointer border border-transparent hover:border-outline-variant/10"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${meeting.iconBgClass}`}>
        <Icon className={meeting.iconColorClass} size={24} />
      </div>
      <div className="flex-grow text-left w-full md:w-auto">
        <h4 className="text-lg font-bold text-on-surface mb-1">{meeting.title}</h4>
        <p className="text-sm text-on-surface-variant">{meeting.date}</p>
      </div>
      <div className="flex items-center gap-8 md:gap-12 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-on-surface">{meeting.transcripts}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Transcripts</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-on-surface">{meeting.actions}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Actions</span>
        </div>
        <div className="flex flex-col items-center">
          <div className={`flex items-center gap-1 ${meeting.sentimentColorClass}`}>
            <span className="text-xl font-bold">{meeting.sentiment}%</span>
            <SentimentIcon size={16} />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Sentiment</span>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4 hidden md:block">
        <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" size={24} />
      </div>
    </div>
  );
}
