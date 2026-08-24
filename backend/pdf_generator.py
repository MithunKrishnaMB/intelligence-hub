import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch

def generate_meeting_pdf(meeting_data: dict) -> io.BytesIO:
    """
    Generates a professional PDF document for the given meeting details.
    Returns an io.BytesIO object containing the PDF data.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72, leftMargin=72,
        topMargin=72, bottomMargin=72
    )

    elements = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = styles['Title']
    title_style.textColor = colors.black
    
    heading_style = styles['Heading2']
    heading_style.textColor = colors.HexColor("#333333")
    heading_style.spaceAfter = 6
    
    normal_style = styles['Normal']
    normal_style.fontSize = 10
    normal_style.leading = 14
    
    sub_normal = ParagraphStyle(
        'SubNormal',
        parent=styles['Normal'],
        textColor=colors.gray,
        fontSize=9
    )

    # 1. Header (Title, Date, Time, Duration, Word Count)
    elements.append(Paragraph(meeting_data.get("filename", "Meeting Details"), title_style))
    
    # Date formatting
    raw_date = meeting_data.get('meeting_date') or meeting_data.get('upload_date', 'Unknown')
    if raw_date and 'T' in raw_date:
        raw_date = raw_date.split('T')[0]
        
    meta_text = (
        f"<b>Date:</b> {raw_date}<br/>"
        f"<b>Duration:</b> {meeting_data.get('duration', 'N/A')} | "
        f"<b>Word Count:</b> {meeting_data.get('word_count', 0)} words"
    )
    elements.append(Paragraph(meta_text, sub_normal))
    elements.append(Spacer(1, 0.25 * inch))

    # 2. Overall Sentiment Score & Overview
    elements.append(Paragraph("Sentiment Overview", heading_style))
    score = meeting_data.get('overall_sentiment_score', 0)
    comment = meeting_data.get('sentiment_comment', '')
    sentiment_text = f"<b>Score: {score}%</b> - {comment}"
    elements.append(Paragraph(sentiment_text, normal_style))
    elements.append(Spacer(1, 0.2 * inch))

    # 3. Summary
    elements.append(Paragraph("Meeting Summary", heading_style))
    elements.append(Paragraph(meeting_data.get('summary', 'No summary available.'), normal_style))
    elements.append(Spacer(1, 0.2 * inch))
    
    # 4. Participants (Speakers)
    speakers = meeting_data.get('speakers', [])
    if speakers:
        elements.append(Paragraph("Participants", heading_style))
        for spk in speakers:
            spk_text = f"• <b>{spk.get('speaker', 'Unknown')}</b> (Vibe: {spk.get('overall_vibe', 'N/A')})"
            if spk.get('alignment'):
                spk_text += f" - {spk.get('alignment')}"
            elements.append(Paragraph(spk_text, normal_style))
        elements.append(Spacer(1, 0.2 * inch))

    # 5. Decisions
    decisions = meeting_data.get('decisions', [])
    if decisions:
        elements.append(Paragraph("Decisions Made", heading_style))
        for i, dec in enumerate(decisions, start=1):
            elements.append(Paragraph(f"{i}. {dec.get('content', '')}", normal_style))
        elements.append(Spacer(1, 0.2 * inch))

    # 6. Action Items
    action_items = meeting_data.get('action_items', [])
    if action_items:
        elements.append(Paragraph("Action Items", heading_style))
        
        # Table data
        data = [["Task", "Owner", "Due Date"]]
        for item in action_items:
            # We use paragraph inside table for text wrapping
            p_task = Paragraph(item.get('task', ''), normal_style)
            data.append([
                p_task,
                item.get('owner', ''),
                item.get('due_date', '')
            ])
            
        t = Table(data, colWidths=[3.5*inch, 1.25*inch, 1.25*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.black),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.whitesmoke),
            ('GRID', (0,0), (-1,-1), 1, colors.gray),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t)

    # Build the PDF
    doc.build(elements)
    
    # Get the value from buffer
    buffer.seek(0)
    return buffer
