import os
import requests
import json
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Using the gemini-2.5-flash model endpoint
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

def extract_meeting_insights(transcript_text: str):
    system_prompt = """
    You are an elite executive assistant and expert AI meeting analyst. Your task is to analyze the provided meeting transcript and extract highly accurate, structured insights.

    ### EXTRACTION GUIDELINES:
    1. Metadata:
      - meeting_date: Identify the exact date the meeting took place based on spoken context (e.g., "today is October 24th") or transcript headers. 
      - speakers_identified: Count the total number of unique, participating speakers in the transcript. Return as an integer.
      - duration: Identify the length of the meeting (e.g., "45 mins", "1 hour") based on explicit mentions or timestamps.
      - summary: Write a concise, professional executive summary (2-3 sentences) capturing the primary purpose of the meeting and its ultimate outcome.

    2. Decisions:
      - Extract only finalized agreements, approvals, or strategic shifts. 
      - Do NOT include brainstorming ideas, rejected proposals, or general discussion points.
      - Write each decision as a clear, standalone sentence.

    3. Action Items:
      - Identify concrete tasks assigned to specific individuals or groups.
      - owner: The name or role of the person responsible. 
      - task: A clear description of the work to be done.
      - due_date: The deadline, translated into a clear timeframe if spoken contextually (e.g., "next Friday" becomes the specific day if known, or remains "Next Friday").

    ### STRICT DATA RULES:
    - If a value (such as meeting_date, duration, summary, owner, or due_date) cannot be explicitly found or confidently inferred, you MUST return an empty string "". 
    - Do NOT use filler words like "Unknown", "N/A", "TBD", or "None".

    ### OUTPUT FORMAT:
    You MUST respond with ONLY a valid, minified JSON object. Do not wrap the JSON in markdown code blocks (e.g., ```json). Do not include any conversational text before or after the JSON. Use this exact schema:

    {
      "metadata": {
        "meeting_date": "October 24, 2023",
        "speakers_identified": 4,
        "duration": "45 mins",
        "summary": "Review of engineering capacity vs. high-priority features for the upcoming quarter. Alignment on key delivery milestones."
      },
      "decisions": [
        "The team agreed to deploy the new UI on Friday.",
        "Budget for Q3 marketing was approved."
      ],
      "action_items": [
        {
          "owner": "John Doe",
          "task": "Update the database schema",
          "due_date": "Next Tuesday"
        }
      ]
    }
    """

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [{
            "parts": [{"text": transcript_text}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.0
        }
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(GEMINI_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        raw_content = response.json()['candidates'][0]['content']['parts'][0]['text']
        return json.loads(raw_content.strip())
        
    except Exception as e:
        print(f"Error calling Gemini or parsing JSON: {e}")
        raise Exception(f"Gemini API Error: {str(e)}")

def analyze_meeting_sentiment(transcript_text: str):
    system_prompt = """
    You are an elite organizational psychologist and behavioral analyst. Your task is to analyze the tone, sentiment, and interpersonal dynamics of the provided meeting transcript.

    ### ANALYSIS GUIDELINES:

    1. Overall Sentiment Score (0-100):
      - Calculate a single integer score representing the holistic emotional temperature of the meeting.
      - Anchor points: 
        * 0-20: Highly toxic, combative, or severe unresolved conflict.
        * 21-40: Tense, frustrating, or significant friction.
        * 41-60: Neutral, transactional, purely informational, or mixed/balanced emotions.
        * 61-80: Collaborative, agreeable, and productive.
        * 81-100: Highly enthusiastic, aligned, and exceptionally positive.

    2. Sentiment Comment:
      - Provide a single, concise sentence justifying the overall score based on the dominant group dynamics (e.g., "High topical consistency and collaborative problem-solving detected.").
      - If a confident comment cannot be generated, return an empty string "".

    3. Chronological Segments:
      - Divide the meeting into chronological, logical phases based on shifts in topic or tone (e.g., 3 to 6 segments depending on meeting length).
      - topic: A short 2-4 word title for the phase.
      - vibe: MUST be chosen strictly from the Allowed Vibes list.

    4. Speaker Analysis:
      - Analyze the individual disposition of each unique speaker. (If speakers are unnamed, use "Speaker 1", "Speaker 2", etc.).
      - overall_vibe: MUST be chosen strictly from the Allowed Vibes list based on their primary tone.
      - alignment: A 1-sentence summary of their primary stance, contribution, or disposition during the meeting.

    ### STRICT RULES & ENUMS:
    - ALLOWED VIBES: You must strictly categorize all `vibe` and `overall_vibe` fields using ONLY one of the following exact strings: "agreement", "conflict", "frustration", "enthusiasm", or "neutral". Do not invent new vibes.
    - FORMATTING: You MUST respond with ONLY a valid, minified JSON object. Do not wrap the JSON in markdown code blocks (e.g., ```json). Do not include any conversational text before or after the JSON.

    ### OUTPUT FORMAT:
    {
      "overall_sentiment_score": 85,
      "sentiment_comment": "High topical consistency and collaborative problem-solving detected.",
      "segments": [
        {
          "segment_index": 1,
          "topic": "Project Timeline Review",
          "vibe": "conflict" 
        },
        {
          "segment_index": 2,
          "topic": "Budget Approval",
          "vibe": "agreement" 
        }
      ],
      "speakers": [
        {
          "speaker": "Alice",
          "overall_vibe": "enthusiasm",
          "alignment": "Strongly supported the new design direction."
        },
        {
          "speaker": "Bob",
          "overall_vibe": "frustration",
          "alignment": "Expressed concerns about the tight deadline."
        }
      ]
    }
    """

    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": transcript_text}] }],
        "generationConfig": {
          "responseMimeType": "application/json",
          "temperature": 0.0
          }
    }

    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(GEMINI_URL, headers=headers, json=payload)
        response.raise_for_status()
        raw_content = response.json()['candidates'][0]['content']['parts'][0]['text']
        return json.loads(raw_content.strip())
    except Exception as e:
        print(f"Error calling Gemini for sentiment analysis: {e}")
        raise Exception(f"Gemini API Error: {str(e)}")

def answer_question_with_context(question: str, context_chunks: list):
    """Passes the user's question and the retrieved ChromaDB chunks to Gemini."""
    
    # Format the retrieved chunks into a readable string for the AI
    context_text = "\n\n".join(
        [f"Source: {chunk['filename']}\nContent: {chunk['text']}" for chunk in context_chunks]
    )

    system_prompt = f"""
    You are an elite AI Meeting Assistant and Knowledge Retrieval Expert. Your sole purpose is to provide highly accurate, structurally clear answers to user questions based EXCLUSIVELY on the provided meeting transcripts.

    ### SYSTEM DIRECTIVES:
    1. Zero Hallucination Policy: You must never use outside knowledge to answer the question. If the information is not explicitly present in the provided context, you must not guess, infer, or invent an answer.
    2. Context Synthesis: If the answer spans multiple transcripts or sections, synthesize the information logically, grouping related points together.

    ### FORMATTING & TONE:
    - Structure for Scannability: Use Markdown formatting heavily. Use bold text for key entities/metrics, bullet points for lists, and short paragraphs. 
    - Tone: Professional, objective, and direct.
    - Directness: Start the answer immediately. Do not use conversational filler like "Based on the provided context..." or "Here is the answer...".

    ### CITATION RULES:
    - Every factual claim MUST be followed by an inline citation referencing the source file.
    - Format citations exactly like this: [Source: filename.txt].
    - Place the citation at the end of the relevant sentence or bullet point. 
    - Do not cite the same file multiple times in a single bullet; group the information logically.

    ### OUT-OF-CONTEXT HANDLING (STRICT):
    - Partial Matches: If the context answers part of the question but not all of it, provide the partial answer and explicitly state at the end: *"Note: The transcripts do not mention [specific missing detail]."*
    - No Matches: If the context contains absolutely no information to answer the question, you MUST decline gracefully. Use this exact structure:
      *"I cannot answer this question because the information is not present in the provided meeting transcripts."*
      *(Optional: If the context contains a highly related topic, you may add: "However, the transcripts do discuss [Related Topic] if you would like to know more about that.")*

    ### INPUT DATA:
    Context from transcripts:
    {context_text}
    """

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [{
            "parts": [{"text": question}]
        }]
    }

    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(GEMINI_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        answer = response.json()['candidates'][0]['content']['parts'][0]['text']
        return answer
        
    except Exception as e:
        print(f"Error answering question: {e}")
        return "Sorry, I encountered an error while trying to answer your question."