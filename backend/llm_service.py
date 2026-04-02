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
    Extract the key decisions made and the action items assigned.
    
    You MUST respond with a valid JSON object in this exact format:
    {
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

    # Gemini API payload structure
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
        
        # Extract the text from Gemini's specific response structure
        raw_content = response.json()['candidates'][0]['content']['parts'][0]['text']
        
        # Because we set responseMimeType to application/json, it is guaranteed to be clean JSON
        return json.loads(raw_content.strip())
        
    except Exception as e:
        print(f"Error calling Gemini or parsing JSON: {e}")
        # Print detailed error from Google if available to help with debugging
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"Response details: {response.text}")
        return {"decisions": [], "action_items": []}

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