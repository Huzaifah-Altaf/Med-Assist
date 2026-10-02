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

if __name__ == '__main__':
    test_connection()