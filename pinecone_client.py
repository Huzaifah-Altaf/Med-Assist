import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()

api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")

pc = Pinecone(api_key=api_key)
index = pc.Index(index_name)

def test_connection():
    stats = index.describe_index_stats()
    print("Connected to Pinecone successfully!!!")
    print(stats)

def search_guidelines(query_text, top_k=3):
    results = index.search(
        namespace="default",
        query={
            "inputs": {"text": query_text},
            "top_k": top_k
        }
    )
    return results

if __name__ == '__main__':
    test_connection()
    results = search_guidelines("patient with kidney problems taking metformin")
    print(results)