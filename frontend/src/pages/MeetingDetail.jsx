import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import SentimentDashboard from '../components/meeting/SentimentDashboard';
import DecisionsTable from '../components/meeting/DecisionsTable';
import ActionItems from '../components/meeting/ActionItems';
import Chatbot from '../components/shared/Chatbot';
import { Share2, MoreVertical, ArrowLeft, Loader2, Download } from 'lucide-react';

import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [meetingData, setMeetingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://127.0.0.1:8000/transcripts/${id}/details`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
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

  // --- PDF EXPORT LOGIC ---
  const handleExportPDF = async () => {
    if (!meetingData) return;
    setIsExporting(true);

    try {
      // 1. Initialize Document
      const doc = new jsPDF();
      const margin = 14;
      let yPos = 20;
      const fileName = meetingData.filename.replace(/\.[^/.]+$/, "");

      // 2. Title & Document Header
      doc.setFontSize(22);
      doc.setTextColor(44, 52, 55);
      doc.text(fileName, margin, yPos);
      yPos += 10;

      // 3. Metadata (Duration, Participants)
      doc.setFontSize(11);
      doc.setTextColor(89, 96, 100);
      
      // Safely extract participant names from the speakers array
      const participantsCount = meetingData.speakers?.length || 0;
      const participantNames = meetingData.speakers?.map(s => s.speaker).join(", ") || "No distinct speakers identified";
      
      const metaText = [
        `Date: ${meetingData.meeting_date || "Unknown"}`,
        `Duration: ${meetingData.duration || "Unknown"}`,
        `Participants (${participantsCount}): ${participantNames}`
      ];
      
      doc.text(metaText, margin, yPos);
      yPos += 20;

      // 4. Summary Section
      doc.setFontSize(14);
      doc.setTextColor(44, 52, 55);
      doc.text("Meeting Summary", margin, yPos);
      yPos += 7;
      
      doc.setFontSize(11);
      doc.setTextColor(89, 96, 100);
      const splitSummary = doc.splitTextToSize(meetingData.summary || "No summary available.", 180);
      doc.text(splitSummary, margin, yPos);
      yPos += (splitSummary.length * 5) + 12;

      // 5. Sentiment Score
      doc.setFontSize(14);
      doc.setTextColor(44, 52, 55);
      doc.text(`Overall Sentiment Score: ${meetingData.overall_sentiment_score}%`, margin, yPos);
      yPos += 8;

      // 6. Capture the Dynamic Sentiment Chart via html2canvas
      const chartElement = document.getElementById("sentiment-export-target");
      if (chartElement) {
        // Take a high-res snapshot of the chart HTML
        const imgData = await toJpeg(chartElement, { 
            quality: 1.0, 
            backgroundColor: '#ffffff',
            pixelRatio: 2 // Keeps the text crisp!
        });
        
        // Calculate aspect ratio to fit the PDF
        const imgWidth = 180;
        const imgHeight = (chartElement.offsetHeight * imgWidth) / chartElement.offsetWidth;

        // Ensure chart doesn't break across a page
        if (yPos + imgHeight > 280) {
          doc.addPage();
          yPos = 20;
        }

        doc.addImage(imgData, 'JPEG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 15;
      }

      // 7. Action Items Table
      if (meetingData.action_items && meetingData.action_items.length > 0) {
        // Ensure table doesn't get cut off immediately
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(14);
        doc.text("Action Items", margin, yPos);
        
        autoTable(doc, {
          startY: yPos + 5,
          head: [['Task', 'Owner', 'Due Date']],
          body: meetingData.action_items.map(item => [item.task, item.owner, item.due_date]),
          theme: 'grid',
          headStyles: { fillColor: [0, 91, 196] },
          styles: { font: 'helvetica', fontSize: 10 },
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
      }

      // 8. Decisions Table
      if (meetingData.decisions && meetingData.decisions.length > 0) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(14);
        doc.text("Key Decisions", margin, yPos);
        
        autoTable(doc, {
          startY: yPos + 5,
          head: [['Agreed Decision']],
          body: meetingData.decisions.map(decision => [decision.content]),
          theme: 'grid',
          headStyles: { fillColor: [0, 91, 196] },
          styles: { font: 'helvetica', fontSize: 10 },
        });
      }

      // 9. Save the Document
      doc.save(`${fileName}_Intelligence_Report.pdf`);
      
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

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
      
      <main className="flex-grow w-full px-6 md:px-8 py-12 pb-32 pt-24">
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
                    {[meetingData.meeting_date, meetingData.duration].filter(Boolean).join(" • ")}
                </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight max-w-3xl mb-0 break-words">
                {meetingData.filename.replace(/\.[^/.]+$/, "")}
            </h1>
            
            {meetingData.summary && (
                <p className="text-lg text-on-surface-variant max-w-2xl font-light leading-relaxed">
                    {meetingData.summary}
                </p>
            )}
            </div>
            
            {/* Top Right Actions */}
            <div className="flex items-center gap-4 mt-6">
                
                {/* NEW: Export PDF Button */}
                <button 
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-all active:scale-95 bg-white shadow-sm border border-outline-variant/20 rounded-lg disabled:opacity-50"
                >
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {isExporting ? "Exporting..." : "Export PDF"}
                </button>

                <button className="p-2 text-slate-500 hover:text-blue-500 transition-all active:scale-95 bg-white shadow-sm border border-outline-variant/20 rounded-lg">
                    <Share2 size={20} />
                </button>
                <button className="p-2 text-slate-500 hover:text-blue-500 transition-all active:scale-95 bg-white shadow-sm border border-outline-variant/20 rounded-lg">
                    <MoreVertical size={20} />
                </button>
            </div>
        </div>

        {/* Wrap SentimentDashboard in an ID so html2canvas can target it! */}
        <div id="sentiment-export-target" className="p-2 -m-2 bg-surface">
            <SentimentDashboard 
                score={meetingData.overall_sentiment_score} 
                segments={meetingData.segments} 
                comment={meetingData.sentiment_comment} 
            />
        </div>
        
        <DecisionsTable decisions={meetingData.decisions} />
        <ActionItems actionItems={meetingData.action_items} />
      </main>

      <Chatbot transcriptId={meetingData.id} />
    </div>
  );
}