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
    You are an expert meeting assistant. Analyze the following meeting transcript.
    Extract the date of the meeting, the number of unique speakers, the key decisions made, and the action items assigned.
    
    If the exact meeting date is not explicitly mentioned, try to infer it or return "Unknown".
    
    You MUST respond with a valid JSON object in this exact format:
    {
      "metadata": {
        "meeting_date": "October 24, 2023",
        "speakers_identified": 4
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

    If the meeting date, duration, or summary cannot be explicitly found or confidently generated, you MUST return an empty string "" instead of 'Unknown' or 'N/A'.
    """

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [{
            "parts": [{"text": transcript_text}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
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
        return {"metadata": {}, "decisions": [], "action_items": []}

def analyze_meeting_sentiment(transcript_text: str):
    system_prompt = """
    You are an expert behavioral analyst. Analyze the tone, sentiment, and vibe of the following meeting transcript.
    
    1. Estimate an overall sentiment score for the entire meeting on a scale of 0 to 100 (where 0 is completely negative/conflict-heavy, 50 is neutral, and 100 is completely positive/enthusiastic).
    2. Provide a short, 1-sentence comment explaining this score (e.g., "High topical consistency detected throughout the meeting").
    3. Break the meeting down into chronological logical segments.
    4. Analyze the overall sentiment of each individual speaker.
    
    You MUST respond with a valid JSON object in this exact format:
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
    
    If you cannot confidently generate a sentiment comment, return an empty string "".
    Valid vibes are strictly: "agreement", "conflict", "frustration", "enthusiasm", or "neutral".
    """

    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": transcript_text}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }

    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(GEMINI_URL, headers=headers, json=payload)
        response.raise_for_status()
        raw_content = response.json()['candidates'][0]['content']['parts'][0]['text']
        return json.loads(raw_content.strip())
    except Exception as e:
        print(f"Error calling Gemini for sentiment analysis: {e}")
        return {"overall_sentiment_score": 50, "segments": [], "speakers": []}

def answer_question_with_context(question: str, context_chunks: list):
    """Passes the user's question and the retrieved ChromaDB chunks to Gemini."""
    
    # Format the retrieved chunks into a readable string for the AI
    context_text = "\n\n".join(
        [f"Source: {chunk['filename']}\nContent: {chunk['text']}" for chunk in context_chunks]
    )

    system_prompt = f"""
    You are an intelligent meeting assistant. Answer the user's question using ONLY the provided context from meeting transcripts.
    
    Context from transcripts:
    {context_text}
    
    Rules:
    1. If the answer is not in the context, say "I cannot find the answer to this in the uploaded transcripts." Do not make up information.
    2. You MUST cite your sources. After stating a fact, indicate the source file in brackets, e.g., (Source: Q3_planning.txt).
    """

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [{
            "parts": [{"text": question}]
        }]
        # Notice we are NOT forcing JSON mode here, because we want a natural text response.
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