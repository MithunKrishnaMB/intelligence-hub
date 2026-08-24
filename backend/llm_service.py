import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Using the gemini-2.5-flash model endpoint
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

def extract_meeting_insights(transcript_text: str):
    system_prompt = """
    You are an elite, C-suite level executive assistant and expert AI meeting analyst. Your task is to analyze the provided meeting transcript and extract highly accurate, structured and strategically valuable insights.

    ### EXTRACTION GUIDELINES:
    1. Metadata:
      - meeting_date: Identify the exact date the meeting took place. Look for spoken context ("today is October 24th", "last Friday") or transcript headers. Format it cleanly.
      - speakers_identified: Count the total number of unique, participating speakers in the transcript. Return as an integer.
      - duration: Identify or estimate the length of the meeting (e.g., "45 mins", "1 hour") based on explicit mentions, timestamps or context.
      - summary: Write a highly professional, C-suite executive summary (3-4 sentences). Do NOT just list what was talked about. Focus on the strategic context, the core purpose of the meeting, major shifts in strategy and the ultimate outcome or consensus reached.

    2. Decisions:
      - Extract only finalized agreements, approvals, strategic shifts or hard commitments. 
      - Do NOT include brainstorming ideas, rejected proposals or general discussion points.
      - Write each decision as a clear, definitive, standalone sentence.

    3. Action Items:
      - Identify concrete tasks assigned to specific individuals, teams or groups.
      - owner: The name or role of the person responsible. If unclear, infer from context or leave empty, but do not guess wildly.
      - task: A clear, actionable description of the work to be done, starting with a strong verb.
      - due_date: The deadline. You MUST actively translate relative dates (e.g., "next Friday", "EOD tomorrow", "Q3") into clear timeframes.

    ### STRICT DATA RULES:
    - If a value cannot be explicitly found or confidently inferred, you MUST return an empty string "". 
    - Do NOT use filler words like "Unknown", "N/A", "TBD", "None" or "No due date found". Use an empty string "" instead.

    ### OUTPUT FORMAT:
    You MUST respond with ONLY a valid, minified JSON object. Do not wrap the JSON in markdown code blocks. Use this exact schema:

    {
      "metadata": {
        "meeting_date": "October 24, 2023",
        "speakers_identified": 4,
        "duration": "45 mins",
        "summary": "The executive team reviewed Q3 financial performance and identified a 15% shortfall in marketing ROI. As a result, the team reached a consensus to pivot the upcoming Q4 campaign strategy towards high-conversion digital channels. Leadership approved an immediate budget reallocation to support this strategic shift."
      },
      "decisions": [
        "The team agreed to deploy the new UI on Friday.",
        "Budget for Q3 marketing was officially approved."
      ],
      "action_items": [
        {
          "owner": "John Doe",
          "task": "Update the database schema to support the new user profiles",
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
    You are an elite organizational psychologist, behavioral analyst and executive coach. Your task is to analyze the tone, sentiment and interpersonal dynamics of the provided meeting transcript with high emotional intelligence.

    ### ANALYSIS GUIDELINES:

    1. Overall Sentiment Score (0-100):
      - Calculate a highly accurate, single integer score representing the holistic emotional temperature of the meeting.
      - Anchor points: 
        * 0-20: Highly toxic, combative, highly stressed or severe unresolved conflict.
        * 21-40: Tense, frustrating, anxious or significant friction/disagreement.
        * 41-60: Neutral, transactional, purely informational or mixed/balanced emotions.
        * 61-80: Collaborative, agreeable, constructive and productive.
        * 81-100: Highly enthusiastic, aligned, inspiring and exceptionally positive.

    2. Sentiment Comment:
      - Provide a single, highly articulate, professional sentence justifying the overall score based on the dominant group dynamics. Example: "The team exhibited high topical consistency and collaborative problem-solving, though some underlying friction regarding timelines was present."
      - Do not just say "The meeting was positive." Provide psychological insight.

    3. Chronological Segments:
      - Divide the meeting into chronological, logical phases based on shifts in topic, tone or energy (e.g., 3 to 6 segments depending on length).
      - topic: A short 2-5 word title for the phase (e.g., "Budget Constraints Review").
      - vibe: MUST be chosen strictly from the Allowed Vibes list.

    4. Speaker Analysis:
      - Analyze the individual disposition and contribution of each unique speaker. (If speakers are unnamed, use "Speaker 1", "Speaker 2", etc.).
      - overall_vibe: MUST be chosen strictly from the Allowed Vibes list based on their primary tone.
      - alignment: A 1-2 sentence professional summary of their primary stance, contribution or behavioral disposition during the meeting. Focus on their strategic alignment or areas of resistance.

    ### STRICT RULES & ENUMS:
    - ALLOWED VIBES: You must strictly categorize all `vibe` and `overall_vibe` fields using ONLY one of the following exact strings: "agreement", "conflict", "frustration", "enthusiasm" or "neutral". Do not invent new vibes.
    - FORMATTING: You MUST respond with ONLY a valid, minified JSON object. Do not wrap the JSON in markdown code blocks.

    ### OUTPUT FORMAT:
    {
      "overall_sentiment_score": 85,
      "sentiment_comment": "High topical consistency and collaborative problem-solving detected, resulting in strong team alignment.",
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
          "alignment": "Strongly supported the new design direction and actively mediated minor disputes."
        },
        {
          "speaker": "Bob",
          "overall_vibe": "frustration",
          "alignment": "Consistently expressed concerns about the tight deadline and resource constraints."
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
    You are an elite Management Consultant, Strategic Advisor and AI Knowledge Retrieval Expert. Your purpose is to provide highly articulate, insightful and perfectly structured answers to user questions based EXCLUSIVELY on the provided meeting transcripts.

    ### SYSTEM DIRECTIVES:
    1. Zero Hallucination Policy: You must NEVER use outside knowledge to answer the question. If the information is not explicitly present in the provided context, you must not guess, infer or invent an answer.
    2. Synthesis & Insight: Don't just regurgitate quotes. Synthesize the information logically into a comprehensive, strategic response that directly answers the user's core intent.
    3. Elite Professional Tone: Adopt the persona of a highly-paid strategic advisor. Be incredibly articulate, confident, formal, yet highly accessible. Avoid robotic AI phrasing like "Based on the provided text...".

    ### FORMATTING & STRUCTURE (CRITICAL):
    - You MUST use rich Markdown formatting to structure your response beautifully.
    - Use clear `### Headings` to break down multi-part answers.
    - Use **bold text** to highlight key terms, metrics or important names.
    - Use bulleted (`-`) or numbered (`1.`) lists heavily for readability.
    - If someone makes a highly significant point, you may use blockquotes (`>`) to highlight it.
    - Do NOT include inline citations like [Source: filename.txt] in your text, as the UI handles sources separately.

    ### OUT-OF-CONTEXT HANDLING:
    - If the context contains absolutely no information to answer the question, politely and professionally decline by stating that the specific information was not discussed in the available meeting transcripts. Do NOT apologize profusely.

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