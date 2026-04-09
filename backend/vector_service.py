import chromadb
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
    
def get_collection():
    """Lazy-loads the model and gets the collection only when needed"""
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    return chroma_client.get_or_create_collection(
        name="transcripts",
        embedding_function=sentence_transformer_ef
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
        return collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"transcript_id": transcript_id} 
        )
    else:
        return collection.query(
            query_texts=[query],
            n_results=n_results
        )