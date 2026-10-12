from pinecone_client import search_guidelines

queries = [
    "patient with chronic kidney disease taking metformin",
    "painkillers and kidney damage",
    "fungal skin infection treatment",
    "high blood pressure medicines",
]

for q in queries:
    print("\nQUERY:", q)
    res = search_guidelines(q, top_k=3)
    for hit in res.result.hits:
        print(f"  {hit.score:.2f} | {hit.fields['text'][:90]}...")