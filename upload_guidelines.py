from pinecone_client import index

guidelines = [
    {
        "id": "guideline-1",
        "text": "In patients with chronic kidney disease, metformin should be used cautiously or avoided due to the risk of lactic acidosis, especially as kidney function declines below standard thresholds."
    },
    {
        "id": "guideline-2",
        "text": "NSAIDs such as ibuprofen can reduce blood flow to the kidneys and may worsen renal function in patients with pre-existing chronic kidney disease. Alternative pain management should be considered."
    },
    {
        "id": "guideline-3",
        "text": "Combining warfarin with aspirin significantly increases the risk of bleeding complications. Careful monitoring of INR levels is recommended if both medications are necessary."
    },
    {
        "id": "guideline-4",
        "text": "Fungal skin infections typically present with itching, redness, and skin eruptions. Topical antifungal treatment is usually the first-line approach for localized infections."
    },
    {
        "id": "guideline-5",
        "text": "Patients with diabetes should have regular kidney function monitoring, as diabetes is a leading cause of progressive chronic kidney disease over time."
    }
]

index.upsert_records(
    namespace="default",
    records=[
        {"_id": g["id"], "text": g["text"]}
        for g in guidelines
    ]
)

print(f"Uploaded {len(guidelines)} guideline snippets to Pinecone")