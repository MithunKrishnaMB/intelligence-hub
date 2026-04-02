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