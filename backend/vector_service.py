import chromadb
from chromadb.utils import embedding_functions

# Initialize ChromaDB to save data locally in a folder named "chroma_data"
chroma_client = chromadb.PersistentClient(path="./chroma_data")

# Use the default, free, local embedding model
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

# Create or load a collection (like a table in SQL) for our transcripts
collection = chroma_client.get_or_create_collection(
    name="transcripts",
    embedding_function=sentence_transformer_ef
)

def chunk_text(text: str, chunk_size: int = 150, overlap: int = 30):
    """Splits a long transcript into overlapping chunks of words."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def add_transcript_to_vector_db(transcript_id: int, filename: str, content: str):
    """Chunks the text and stores it in ChromaDB with metadata for citations."""
    chunks = chunk_text(content)
    
    documents = []
    metadatas = []
    ids = []
    
    for i, chunk in enumerate(chunks):
        documents.append(chunk)
        # Store metadata so the AI can cite its sources later
        metadatas.append({"transcript_id": transcript_id, "filename": filename})
        # Create a unique ID for each chunk
        ids.append(f"transcript_{transcript_id}_chunk_{i}")
        
    # Add to ChromaDB
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    print(f"Added {len(chunks)} chunks for {filename} to ChromaDB.")

def search_transcripts(query: str, n_results: int = 5, transcript_id: int = None):
    """Searches the vector DB, optionally filtering by a specific transcript."""
    
    if transcript_id is not None:
        # Search ONLY within the specific meeting using a metadata filter
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"transcript_id": transcript_id} 
        )
    else:
        # Global search across all meetings (useful for the Dashboard Home Page)
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
    return results