from pinecone_client import index

ids = [
    "guideline-1", "guideline-2", "guideline-3", "guideline-4",
    "guideline-5", "guideline-6", "guideline-7",
]

index.delete(ids=ids, namespace="default")
print("Delete request sent for", len(ids), "ids")