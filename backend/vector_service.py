# pyrefly: ignore [missing-import]
import chromadb
# pyrefly: ignore [missing-import]
from chromadb.utils import embedding_functions
import os

chroma_api_key = os.getenv("CHROMA_API_KEY")
chroma_tenant = os.getenv("CHROMA_TENANT")
chroma_database = os.getenv("CHROMA_DATABASE")

if chroma_api_key and chroma_tenant and chroma_database:
    chroma_client = chromadb.CloudClient(
        tenant=chroma_tenant,
        database=chroma_database,
        api_key=chroma_api_key
    )
    print("Connected to Chroma Cloud.")
else:
    chroma_client = chromadb.PersistentClient(path="./chroma_data")
    print("Connected to local ChromaDB.")
    
import requests
# pyrefly: ignore [missing-import]
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings

class DirectGeminiEmbeddingFunction(EmbeddingFunction):
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Use standard embedContent endpoint which is universally available
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"

    def __call__(self, input: Documents) -> Embeddings:
        embeddings = []
        for text in input:
            payload = {
                "model": "models/gemini-embedding-001",   
                "content": {"parts": [{"text": text}]}
            }
            res = requests.post(self.url, json=payload)
            res.raise_for_status()
            
            # The response structure is {"embedding": {"values": [...]}}
            embeddings.append(res.json().get("embedding", {}).get("values", []))
            
        return embeddings

def get_collection():
    """Uses Google's fast embeddings API natively to avoid dependency conflicts"""
    gemini_ef = DirectGeminiEmbeddingFunction(api_key=os.getenv("GEMINI_API_KEY"))
    return chroma_client.get_or_create_collection(
        name="transcripts_v2", 
        embedding_function=gemini_ef
    )

def chunk_text(text: str, chunk_size: int = 150, overlap: int = 30):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def add_transcript_to_vector_db(transcript_id: int, filename: str, content: str):
    chunks = chunk_text(content)
    documents = []
    metadatas = []
    ids = []
    
    for i, chunk in enumerate(chunks):
        documents.append(chunk)
        metadatas.append({"transcript_id": transcript_id, "filename": filename})
        ids.append(f"transcript_{transcript_id}_chunk_{i}")
        
    # Get the collection right here instead
    collection = get_collection()
    collection.add(documents=documents, metadatas=metadatas, ids=ids)
    print(f"Added {len(chunks)} chunks for {filename} to Chroma.")

def search_transcripts(query: str, n_results: int = 5, transcript_id: int = None):
    # Get the collection right here instead
    collection = get_collection()
    
    if transcript_id is not None:
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"transcript_id": transcript_id} 
        )
    else:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
    # Legacy Fallback: If no results found in v2, check the older "transcripts" collection
    if not results.get('documents') or len(results['documents'][0]) == 0:
        try:
            legacy_collection = chroma_client.get_collection(name="transcripts")
            if transcript_id is not None:
                results = legacy_collection.query(
                    query_texts=[query],
                    n_results=n_results,
                    where={"transcript_id": transcript_id} 
                )
            else:
                results = legacy_collection.query(
                    query_texts=[query],
                    n_results=n_results
                )
        except Exception as e:
            print(f"Legacy fallback failed: {e}")
            
    return results