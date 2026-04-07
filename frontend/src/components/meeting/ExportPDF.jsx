import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportPDF({ meetingData }) {
  const [isExporting, setIsExporting] = useState(false);

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
        const imgData = await toJpeg(chartElement, { 
            quality: 1.0, 
            backgroundColor: '#ffffff',
            pixelRatio: 2 
        });
        
        const imgWidth = 180;
        const imgHeight = (chartElement.offsetHeight * imgWidth) / chartElement.offsetWidth;

        if (yPos + imgHeight > 280) {
          doc.addPage();
          yPos = 20;
        }

        doc.addImage(imgData, 'JPEG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 15;
      }

      // 7. Action Items Table
      if (meetingData.action_items && meetingData.action_items.length > 0) {
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

  return (
    <button 
      onClick={handleExportPDF}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-all active:scale-95 bg-white shadow-sm border border-outline-variant/20 rounded-lg disabled:opacity-50"
    >
        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        {isExporting ? "Exporting..." : "Export PDF"}
    </button>
  );
}