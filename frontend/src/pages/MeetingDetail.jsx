import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import SentimentDashboard from '../components/meeting/SentimentDashboard';
import DecisionsTable from '../components/meeting/DecisionsTable';
import ActionItems from '../components/meeting/ActionItems';
import Chatbot from '../components/shared/Chatbot';
import { Share2, MoreVertical, ArrowLeft, Loader2 } from 'lucide-react';

export default function MeetingDetail() {
  const { id } = useParams(); // Gets the meeting ID from the URL
  const navigate = useNavigate();
  
  const [meetingData, setMeetingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`http://127.0.0.1:8000/transcripts/${id}/details`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }});
          
        if (!response.ok) throw new Error("Failed to fetch meeting details");
        const data = await response.json();
        setMeetingData(data);
      } catch (error) {
        console.error(error);
        alert("Could not load meeting details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetingDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!meetingData) return <div className="text-center mt-24">Meeting not found.</div>;

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow max-w-[1440px] mx-auto w-full px-6 py-12 pb-32 pt-24">
        {/* Back Button */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-primary mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="flex justify-between items-start mb-12">
            <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest uppercase rounded-full">
                    {meetingData.word_count} Words
                </span>
                <span className="text-on-surface-variant text-sm">
                    {/* This neatly joins the date and duration with a bullet ONLY if they exist */}
                    {[meetingData.meeting_date, meetingData.duration].filter(Boolean).join(" • ")}
                </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight max-w-3xl mb-0 break-words">
                {meetingData.filename.replace(/\.[^/.]+$/, "")}
            </h1>
            
            {/* Only render the summary paragraph if it is not empty */}
            {meetingData.summary && (
                <p className="text-lg text-on-surface-variant max-w-2xl font-light leading-relaxed">
                    {meetingData.summary}
                </p>
            )}
            
            </div>

            <div className="flex items-center gap-4 mt-6">
                <button className="p-2 text-slate-500 hover:text-blue-500 transition-all active:scale-95 bg-white shadow-sm border border-outline-variant/20 rounded-lg">
                    <Share2 size={20} />
                </button>
                <button className="p-2 text-slate-500 hover:text-blue-500 transition-all active:scale-95 bg-white shadow-sm border border-outline-variant/20 rounded-lg">
                    <MoreVertical size={20} />
                </button>
            </div>
        </div>

        {/* Pass the fetched data down as props */}
        <SentimentDashboard 
            score={meetingData.overall_sentiment_score} 
            segments={meetingData.segments} 
            comment={meetingData.sentiment_comment} 
        />
        <DecisionsTable decisions={meetingData.decisions} />
        <ActionItems actionItems={meetingData.action_items} />
      </main>

      {/* Pass the transcript_id to the Chatbot so it knows which meeting to search */}
      <Chatbot transcriptId={meetingData.id} />
    </div>
  );
}